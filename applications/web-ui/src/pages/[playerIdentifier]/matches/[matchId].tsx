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
import { MatchDetails } from 'src/components/Reports'

const Page = ({ renderReport, matchDetailsProps }) => {
    return (
        <Template title="Call of Duty Warzone Match Details" renderReport={renderReport}>
            <div className="container text-center" style={{paddingTop: 64}}>
                <MatchDetails.Component {...matchDetailsProps} />
            </div>
        </Template>
    )
}

Page.getInitialProps = async ({ store, res, req, query }:NextPageContext) => {
    const matchId = query.matchId as string
    const { data } = await api.CallOfDuty.WZ.Match.Details(query.playerIdentifier as string, 'uno', matchId)
    return { matchDetailsProps: { ...data, matchId } }
}

// eslint-disable-next-line import/no-default-export
export default Page
