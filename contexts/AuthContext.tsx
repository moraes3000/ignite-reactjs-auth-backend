import { createContext, ReactNode, useEffect, useState } from "react";
import { setCookie, parseCookies, destroyCookie } from 'nookies'
import Router from 'next/router'

import { api } from "../services/api";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string;
}


type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  user: User;
  isAuthenticated: boolean;
}

type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

export function sighOut() {
  destroyCookie(undefined, 'nomeDaAplicacao.token')
  destroyCookie(undefined, 'nomeDaAplicacao.refreshToken')

  Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>()
  const isAuthenticated = !!user;

  useEffect(() => {
    const { 'nomeDaAplicacao.token': token } = parseCookies()

    if (token) {
      api.get('/me').then(response => {
        // console.log(response)
        const { email, permissions, roles } = response.data;

        setUser({ email, permissions, roles })
      })
        .catch(() => {
          sighOut()
        })
    }
  }, [])

  async function signIn({ email, password }: SignInCredentials) {
    try {
      // console.log({ email, password });
      const response = await api.post('sessions', {
        email, password
      })
      // console.log(response.data)
      const { token, refreshToken, permissions, roles } = response.data;
      // cookies
      setCookie(undefined, 'nomeDaAplicacao.token', token, {
        maxAge: 60 * 60 * 24 * 30, //segundo * minuto * hora *  dia = 30 dias de validação
        path: '/'
      })
      setCookie(undefined, 'nomeDaAplicacao.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, //segundo * minuto * hora *  dia = 30 dias de validação
        path: '/'
      })

      setUser({
        email,
        permissions,
        roles,
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}`

      Router.push('/dashboard')


    } catch (error) {
      console.log(error)
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
      {children}
    </AuthContext.Provider>
  )
}