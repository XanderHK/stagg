import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Center from '../components/Center'
import Template from '../components/Template'
import { Wrapper, FormWrapper } from './login'


export const Page = ({ user, domain }) => {
  const { query } = useRouter()
  return (
    <Template user={user} domain={domain}>
      <Head>
        <title>Email Confirmation</title>
      </Head>
      <Wrapper>
        <Center>
          <FormWrapper>
              <Center>
                  <h2>Your email has been confirmed.</h2>
              </Center>
          </FormWrapper>
          <p><Link href="/login"><a>Back to login</a></Link></p>
        </Center>
      </Wrapper>
    </Template>
  )
}

// Page.getInitialProps = async (ctx:any) => {
//   return {}
// }

export default Page
