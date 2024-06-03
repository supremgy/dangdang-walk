import { Injectable } from '@nestjs/common';
import { DeleteResult, FindManyOptions, FindOptionsWhere } from 'typeorm';
import { JournalPhotos } from './journal-photos.entity';
import { JournalPhotosRepository } from './journal-photos.repository';

@Injectable()
export class JournalPhotosService {
    constructor(private readonly journalPhotosRepository: JournalPhotosRepository) {}

    private async createIfNotExists(
        data: Partial<JournalPhotos>,
        keys: (keyof JournalPhotos)[]
    ): Promise<JournalPhotos> {
        const newEntity = new JournalPhotos(data);
        return this.journalPhotosRepository.createIfNotExists(newEntity, keys);
    }

    async find(where: FindManyOptions<JournalPhotos>): Promise<JournalPhotos[]> {
        return this.journalPhotosRepository.find(where);
    }

    async delete(where: FindOptionsWhere<JournalPhotos>): Promise<DeleteResult> {
        return this.journalPhotosRepository.delete(where);
    }

    async createNewPhotoUrls(journalId: number, photoUrls: string[]) {
        const keys: (keyof JournalPhotos)[] = ['journalId', 'photoUrl'];
        const data: Partial<JournalPhotos> = {};

        data.journalId = journalId;
        for (const curUrl of photoUrls) {
            data.photoUrl = curUrl;
            await this.createIfNotExists(data, keys);
        }
    }

    async getPhotoUrlsByJournalId(journalId: number): Promise<string[]> {
        const findResult = await this.journalPhotosRepository.find({ where: { journalId } });
        return findResult.map((cur) => {
            return cur.photoUrl;
        });
    }
}
