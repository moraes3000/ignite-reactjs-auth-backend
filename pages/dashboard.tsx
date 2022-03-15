import { destroyCookie } from "nookies"
import { useContext, useEffect } from "react"
import { Can } from "../components/Can"
import { AuthContext, signOut } from "../contexts/AuthContext"
import { useCan } from "../hooks/useCan"
import { setupAPIClient } from "../services/api"
import { api } from "../services/apiClient"
import { AuthTokenError } from "../services/errors/AuthTokenError"
import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {
  const { user } = useContext(AuthContext)
  const userCanSeeMetrics = useCan({
    // permissions: ['metrics.list']
    roles: ['administrator', 'editor']
  });

  useEffect(() => {
    api.get('/me')
      .then(response => console.log(response))
  }, [])

  return (
    <>
      <h1>dashboard: {user?.email}</h1>
      <button onClick={signOut}>Sair</button>
      {userCanSeeMetrics && <div>metricas</div>}


      <Can permissions={['metrics.list']}>
        <div>metricas  componente</div>
      </Can>
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx);
  const response = await apiClient.get('/me')

  console.log(response)

  return {
    props: {}
  }
})
