import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
    id: string,
    name: string,
    login: string,
    avatar_url: string,
}

type AuthContextData = {
    user: User | null,
    signInUrl: string,
    singOut: () => void,
}

export const AuthContext = createContext({} as AuthContextData);

type AuthProviderProps = {
    children: ReactNode;
}

type AuthResponse = {
    token: string,
    user: {
        id: string,
        name: string,
        login: string,
        avatar_url: string,
    }
}

export function AuthProvider(props: AuthProviderProps) {

    const [user, setUser] = useState<User | null>(null);

    const client_id = "1c2ae2adb77c46d872e3";
    const signInUrl = `https://github.com/login/oauth/authorize?escope=user&client_id=${client_id}`;

    async function signIn(githubCode: string) {
        const response = await api.post<AuthResponse>('authenticate', {
            code: githubCode
        })

        const { token, user } = response.data;

        localStorage.setItem('@MessagesApp:token', token);

        setUser(user)
    }

    function singOut() {
        setUser(null);
        localStorage.removeItem('@MessagesApp:token');
    }

    useEffect(() => {
        const token = localStorage.getItem('@MessagesApp:token')

        if (token) {
            api.defaults.headers.common.authorization = `Bearer ${token}`;

            api.get<User>('profile').then(response => {
                setUser(response.data);
            })
        }
    }, []);

    useEffect(() => {
        const url = window.location.href;
        const hasGithubCode = url.includes('?code=');

        if (hasGithubCode) {
            const [urlWithoutCode, githubCode] = url.split('?code=');
            // console.log({ urlWithoutCode, githubCode });

            window.history.pushState({}, '', urlWithoutCode);
            signIn(githubCode);
        }
    }, [])

    return (
        <AuthContext.Provider value={{ signInUrl, user, singOut }}>
            {props.children}
        </AuthContext.Provider>
    )
}