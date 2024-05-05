import { Dog } from '@/models/dog.model';
import { walkPercentFormat } from '@/utils/format';
import Ic from '@/assets/icons/ic.svg';
import Group from '@/assets/icons/walk/group.svg';

import Avatar from '@/components/common/Avatar';

interface DogStatistic extends Dog {
    recommendedDailyWalkAmount: number;
    dailyWalkAmount: number;
    weeklyWalks: number[];
    photoUrl: string;
}

interface DogCardProps {
    dog: DogStatistic;
}

const WEEKDAY = ['월', '화', '수', '목', '금', '토', '일'];
export default function DogCard({ dog }: DogCardProps) {
    return (
        <div className="flex-col relative bg-white rounded-lg shadow">
            <div className="flex justify-between pl-[15px] pr-5 pt-[5px]">
                <Avatar url={dog.photoUrl} name={dog.name} />
                <img src={Ic} alt="ic" />
            </div>
            <div className="flex justify-start items-center gap-2 pl-[15px]">
                {dog.weeklyWalks.map((walk, index) => {
                    return walk === 0 ? <div>{WEEKDAY[index]}</div> : <img src={Group} alt="walk" />;
                })}
            </div>
            <div className="p-2.5 flex flex-col justify-start gap-3">
                <div className="text-neutral-800 pl-[5px] text-xs font-bold leading-[18px]">
                    {dog.dailyWalkAmount === 0
                        ? '산책하러 나가요!'
                        : dog.dailyWalkAmount >= dog.recommendedDailyWalkAmount
                          ? '오늘은 만족스러워요😁'
                          : '산책이 모자라요😢'}
                </div>
                <div className="flex gap-2 justify-start">
                    <span>progress bar</span>
                    <span>
                        <span className="text-amber-500 text-sm font-bold leading-[21px]">
                            {walkPercentFormat(dog.dailyWalkAmount / dog.recommendedDailyWalkAmount)}
                        </span>
                        <span className="text-neutral-400 text-sm font-bold leading-[18px]">/100</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
