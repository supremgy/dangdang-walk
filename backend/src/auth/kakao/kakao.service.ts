import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AuthService, OAuthService } from '../auth.service';

interface requestTokenResponse {
    token_type: string;
    access_token: string;
    id_token?: string;
    expires_in: number;
    refresh_token: string;
    refresh_token_expires_in: number;
    scope?: string;
}

interface requestUserInfoResponse {
    id: number;
    has_signed_up?: boolean;
    connected_at?: Date;
    synched_at?: Date;
    properties?: JSON;
    kakao_account?: { [key: string]: any };
    for_partner?: { uuid?: string };
}

@Injectable()
export class KakaoService implements OAuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly authService: AuthService
    ) {}

    private readonly logger = new Logger(KakaoService.name);
    private readonly CLIENT_ID = this.configService.get<string>('KAKAO_CLIENT_ID');
    private readonly REDIRECT_URI = this.configService.get<string>('KAKAO_REDIRECT_URI');
    private readonly CLIENT_SECRET = this.configService.get<string>('KAKAO_CLIENT_SECRET');
    private readonly PROVIDER = 'kakao';

    async requestToken(autherizeCode: string): Promise<requestTokenResponse> {
        const { data } = await firstValueFrom(
            this.httpService.post<requestTokenResponse>(
                'https://kauth.kakao.com/oauth/token',
                {
                    code: autherizeCode,
                    grant_type: 'authorization_code',
                    client_id: this.CLIENT_ID,
                    redirect_uri: this.REDIRECT_URI,
                    client_secret: this.CLIENT_SECRET,
                },
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    },
                }
            )
        );

        return data;
    }

    async requestUserInfo(accessToken: string): Promise<requestUserInfoResponse> {
        const { data } = await firstValueFrom(
            this.httpService.get<requestUserInfoResponse>('https://kapi.kakao.com/v2/user/me', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                },
            })
        );

        return data;
    }

    async login(autherizeCode: string) {
        const { access_token: oauthAccessToken } = await this.requestToken(autherizeCode);
        const { id: oauthId } = await this.requestUserInfo(oauthAccessToken);

        // oauthId가 users table에 존재하는지 확인해서 로그인 or 회원가입 처리하고 userId 가져오기
        const userId = 1;
        const accessToken = this.authService.signToken(userId, 'access', this.PROVIDER);
        const refreshToken = this.authService.signToken(userId, 'refresh', this.PROVIDER);
        // users table에 refreshToken 저장

        return { accessToken };
    }
}
