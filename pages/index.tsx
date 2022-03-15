import { GetServerSideProps } from "next"
import { FormEvent, useContext, useState } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { parseCookies } from 'nookies'

import styles from '../styles/Home.module.css'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { signIn } = useContext(AuthContext)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const data = {
      email, password,
    }
    await signIn(data);

  }
  return (
    <>
      <form onSubmit={handleSubmit} className={styles.main}>
        <input type='email' value={email} onChange={e => setEmail(e.target.value)} />
        <input type='password' value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Entrar</button>
      </form>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  // console.log(ctx.req.cookies)
  const cookies = parseCookies(ctx);

  if (cookies['nomeDaAplicacao.token']) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      }
    }
  }

  return {
    props: {}
  }
}
