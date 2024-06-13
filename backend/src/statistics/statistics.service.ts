import { Injectable, NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';

import { Period } from './pipes/period-validation.pipe';

import { DogStatistic } from './types/statistic.type';

import { BreedService } from '../breed/breed.service';
import { WinstonLoggerService } from '../common/logger/winstonLogger.service';
import { DogWalkDayService } from '../dog-walk-day/dog-walk-day.service';
import { DogsService } from '../dogs/dogs.service';
import { DogSummary } from '../dogs/types/dog-summary.type';
import { JournalsService } from '../journals/journals.service';
import { TodayWalkTimeService } from '../today-walk-time/today-walk-time.service';
import { UsersService } from '../users/users.service';

import { getOneMonthAgo, getStartAndEndOfMonth, getStartAndEndOfWeek } from '../utils/date.util';

@Injectable()
export class StatisticsService {
    constructor(
        private readonly usersService: UsersService,
        private readonly dogsService: DogsService,
        private readonly breedService: BreedService,
        private readonly dogWalkDayService: DogWalkDayService,
        private readonly todayWalkTimeService: TodayWalkTimeService,
        private readonly journalsService: JournalsService,
        private readonly logger: WinstonLoggerService,
    ) {}

    //TODO: Date 값 함수로 만들어서 반환 -> 유효하지 않은 period면 Error 던지기
    async getDogStatistics(userId: number, dogId: number, period: Period) {
        let startDate: Date;
        let endDate: Date;
        startDate = endDate = new Date();

        if (period === 'month') {
            startDate = getOneMonthAgo(new Date());
        }

        return this.journalsService.findJournalsAndGetTotal(userId, dogId, startDate, endDate);
    }

    //TODO: Date 값 함수로 만들어서 반환 -> 유효하지 않은 period면 Error 던지기
    async getDogWalkCnt(userId: number, dogId: number, date: string, period: Period) {
        let startDate: Date;
        let endDate: Date;
        startDate = endDate = new Date();

        if (period === 'month') {
            ({ startDate, endDate } = getStartAndEndOfMonth(new Date(date)));
        } else if (period === 'week') {
            ({ startDate, endDate } = getStartAndEndOfWeek(new Date(date)));
        }

        return this.journalsService.findJournalsAndAggregateByDay(userId, dogId, startDate, endDate);
    }

    //TODO: select로 변경
    private makeStatisticData(
        dogProfiles: DogSummary[],
        recommendedWalkAmount: number[],
        todayWalkAmount: number[],
        weeklyWalks: number[][],
    ): DogStatistic[] {
        const result: DogStatistic[] = [];

        for (let i = 0; i < dogProfiles.length; i++) {
            result.push({
                id: dogProfiles[i].id,
                name: dogProfiles[i].name,
                profilePhotoUrl: dogProfiles[i].profilePhotoUrl,
                recommendedWalkAmount: recommendedWalkAmount[i],
                todayWalkAmount: todayWalkAmount[i],
                weeklyWalks: weeklyWalks[i],
            });
        }

        return result;
    }

    //TODO: 쿼리 빌더 만들어서 성능 비교
    async getDogsStatistics(userId: number): Promise<DogStatistic[]> {
        const ownDogIds = await this.usersService.getOwnDogsList(userId);
        //TODO: 한번에 가져오게 select로 바꾸기
        const dogWalkDayIds = await this.dogsService.getRelatedTableIdList(ownDogIds, 'walkDayId');
        const todayWalkTimeIds = await this.dogsService.getRelatedTableIdList(ownDogIds, 'todayWalkTimeId');
        const breedIds = await this.dogsService.getRelatedTableIdList(ownDogIds, 'breedId');

        const dogSummaries = await this.dogsService.getDogsSummaryList({ id: In(ownDogIds) });
        const recommendedWalkAmount = await this.breedService.getRecommendedWalkAmountList(breedIds);
        const todayWalkAmount = await this.todayWalkTimeService.getWalkTimeList(todayWalkTimeIds);
        const weeklyWalks = await this.dogWalkDayService.getWalkDayList(dogWalkDayIds);

        const length = ownDogIds.length;
        const mismatchedLengths = [
            dogSummaries.length !== length && `dogProfiles.length = ${dogSummaries.length}`,
            recommendedWalkAmount.length !== length && `recommendedWalkAmount.length = ${recommendedWalkAmount.length}`,
            todayWalkAmount.length !== length && `todayWalkAmount.length = ${todayWalkAmount.length}`,
            weeklyWalks.length !== length && `weeklyWalks.length = ${weeklyWalks.length}`,
        ].filter(Boolean);

        if (mismatchedLengths.length > 0) {
            const error = new NotFoundException(`Data missing or mismatched for dogId: ${ownDogIds}.`);
            this.logger.error(
                `Data missing or mismatched for dogId: ${ownDogIds}. Expected length: ${length}. Mismatched data: ${mismatchedLengths.join(', ')}`,
                { trace: error.stack ?? 'No stack' },
            );
            throw error;
        }

        return this.makeStatisticData(dogSummaries, recommendedWalkAmount, todayWalkAmount, weeklyWalks);
    }
}
