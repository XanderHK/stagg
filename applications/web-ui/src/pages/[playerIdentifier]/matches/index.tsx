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
import { MatchPreview } from 'src/components/Reports/MatchPreview'
import { Model } from '@stagg/api'

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
    const unoUsername = query.playerIdentifier as string
    const { data: { results } } = await api.CallOfDuty.WZ.Match.History(unoUsername, 'uno', Model.CallOfDuty.format.filters.urlToObj(query as {[key:string]:string}))
    return { results }
}

// eslint-disable-next-line import/no-default-export
export default Page
