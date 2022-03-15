import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";

import decode from 'jwt-decode'
import { validateUserPermissions } from "./validateUserPermissions";

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions) {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx);
    const token = cookies['nomeDaAplicacao.token'];
    if (!token) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        }
      }
    }

    if (options) {
      const user = decode<{ permissions: string[], roles: string[] }>(token);
      const { permissions, roles } = options;

      const userHasValidPermission = validateUserPermissions({
        user,
        permissions,
        roles
      })

      if (!userHasValidPermission) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          }
        }
      }
    }

    try {
      return await fn(ctx)

    } catch (err) {
      if (err instanceof AuthTokenError) {
        destroyCookie(ctx, 'nomeDaAplicacao.refreshToken')
        destroyCookie(ctx, 'nomeDaAplicacao.token')
        return {
          redirect: {
            destination: '/',
            permanent: false
          }
        }
      }
    }

  }
}