import { ResponseToken, getAccessToken, requestLogin, requestLogout, requestSignup } from '@/api/auth';
import queryClient from '@/api/queryClient';
import { queryKeys, storageKeys, tokenKeys } from '@/constants';
import { useAuthStore } from '@/store/authStore';
import { UseMutationCustomOptions } from '@/types/common';
import { removeHeader, setHeader } from '@/utils/header';
import { getStorage } from '@/utils/storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useLogin = (mutationOptions?: UseMutationCustomOptions) => {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: requestLogin,
        onSuccess: ({ accessToken }: ResponseToken) => {
            const url = getStorage(storageKeys.REDIRECT_URI) || '';

            setHeader(tokenKeys.AUTHORIZATION, `Bearer ${accessToken}`);
            navigate(url);
        },
        onError: (error) => {
            if (error.response && error.response.status === 404) {
                navigate('/join');
            }
        },
        onSettled: () => {
            queryClient.refetchQueries({ queryKey: [queryKeys.AUTH, queryKeys.GET_ACCESS_TOKEN] });
        },
        ...mutationOptions,
    });
};

const useSignup = (mutationOptions?: UseMutationCustomOptions) => {
    const navigate = useNavigate();
    return useMutation({
        mutationFn: requestSignup,
        onSuccess: ({ accessToken }: ResponseToken) => {
            const url = getStorage(storageKeys.REDIRECT_URI) || '';
            setHeader(tokenKeys.AUTHORIZATION, `Bearer ${accessToken}`);
            navigate(url);
        },
        onSettled: () => {
            queryClient.refetchQueries({ queryKey: [queryKeys.AUTH, queryKeys.GET_ACCESS_TOKEN] });
        },
        ...mutationOptions,
    });
};

const useGetRefreshToken = () => {
    const { expiresIn } = useAuthStore();

    const { isSuccess, isError, data } = useQuery({
        queryKey: [queryKeys.AUTH, queryKeys.GET_ACCESS_TOKEN],
        queryFn: getAccessToken,
        gcTime: expiresIn + 1000 * 60,
        staleTime: expiresIn - 1000 * 60 * 10,
        refetchInterval: expiresIn - 1000 * 60 * 10,
        refetchOnReconnect: true,
        refetchIntervalInBackground: true,
    });
    useEffect(() => {
        if (isSuccess) {
            setHeader(tokenKeys.AUTHORIZATION, `Bearer ${data.accessToken}`);
        }
    }, [isSuccess, data]);

    useEffect(() => {
        if (isError) {
            removeHeader(tokenKeys.AUTHORIZATION);
        }
    }, [isError]);
    return { isSuccess, isError };
};

const useLogout = (mutationOptions?: UseMutationCustomOptions) => {
    const { storeLogout } = useAuthStore();
    return useMutation({
        mutationFn: requestLogout,
        onSuccess: () => {
            storeLogout();
            queryClient.resetQueries({ queryKey: [queryKeys.AUTH] });
        },
        ...mutationOptions,
    });
};

export const useAuth = () => {
    const loginMutation = useLogin();
    const logoutMutation = useLogout();
    const signupMustation = useSignup();
    const refreshTokenQuery = useGetRefreshToken();
    return {
        loginMutation,
        isLoggedIn: refreshTokenQuery.isSuccess,
        logoutMutation,
        signupMustation,
        refreshTokenQuery,
    };
};
