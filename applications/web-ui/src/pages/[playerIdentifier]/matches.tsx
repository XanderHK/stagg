/*********************************************************************************
 * ============================================================================= *
 * !!!                     ASSET PATHS MUST BE ABSOLUTE                      !!! *
 * ============================================================================= *
 * ie: CORRECT: <img src="http://example.com/image.png" />                       *
 *     INCORRECT: <img src="/image.png" />                                       *
 *********************************************************************************/
import { NextPageContext } from 'next'
import { api } from 'src/api-service'
import { Template } from 'src/components/Template'
import { MatchPreview } from 'src/components/Reports/Match/MatchPreview'

const Page = ({ renderReport, results }) => {
    return (
        <Template title="Call of Duty Warzone Match History" renderReport={renderReport}>
            <div className="container text-center" style={{paddingTop: 64}}>
                {
                    results.map(p => <MatchPreview key={p.matchId} gameType="wz" matchDetails={p} />)
                }
            </div>
        </Template>
    )
}

Page.getInitialProps = async ({ store, res, req, query }:NextPageContext) => {
    const limit = query.limit as string
    const skip = query.skip as string
    const unoUsername = query.playerIdentifier as string
    const { data: { results } } = await api.CallOfDuty.WZ.Match.History(unoUsername, 'uno', { limit: { count: 10 } })
    return { results }
}

// eslint-disable-next-line import/no-default-export
export default Page
