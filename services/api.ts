import axios, { AxiosError } from "axios";
import { Resolver } from "dns";
import { parseCookies, setCookie } from 'nookies'
import { sighOut } from "../contexts/AuthContext";
import { AuthTokenError } from "./errors/AuthTokenError";

let isRefreshing = false;
let failedRequestsQueue = [];


export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies['nomeDaAplicacao.token']}`
    }
  });

  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError) => {
    // console.log(error.response.status);
    if (error.response.status == 401) {
      if (error.response.data?.code == 'token.expired') {
        // renova o token
        cookies = parseCookies(ctx);

        const { 'nomeDaAplicacao.refreshToken': refreshToken } = cookies;
        const originalConfig = error.config;

        if (!isRefreshing) {
          isRefreshing = true;

          api.post('/refresh', {
            refreshToken,
          }).then(response => {
            const { token } = response.data;

            setCookie(ctx, 'nomeDaAplicacao.token', token, {
              maxAge: 60 * 60 * 24 * 30, //segundo * minuto * hora *  dia = 30 dias de validação
              path: '/'
            })
            setCookie(ctx, 'nomeDaAplicacao.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, //segundo * minuto * hora *  dia = 30 dias de validação
              path: '/'
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`

            failedRequestsQueue.forEach(request => request.onSuccess(token))
            failedRequestsQueue = [];

          }).catch(err => {
            failedRequestsQueue.forEach(request => request.onFailure(err))
            failedRequestsQueue = [];

            // if (process.browser) {
            if (process.browser) {
              // sighOut();
              sighOut();
            }

          }).finally(() => {
            isRefreshing = false;
          });
        }

        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers['Authorization'] = `Bearer ${token}`

              resolve(api(originalConfig));
            },
            onFailure: (err: AxiosError) => {
              reject(err);
            }
          })
        })
      } else {
        // desloga o usuário
        if (process.browser) {
          // sighOut();
          sighOut();
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
    return Promise.reject(error);
  });

  return api;
}