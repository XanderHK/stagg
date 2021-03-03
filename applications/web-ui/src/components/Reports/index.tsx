import { Model } from '@stagg/api'
import styled from 'styled-components'

export * as Barracks from './Barracks'
export * as MatchDetails from './MatchDetails'

export interface ReportLazyLoadProps {
    accountIdentifier: {
        unoId?:string
        accountId?:string
        uno?:string
        xbl?:string
        psn?:string
        battle?:string
    }
}

export interface ReportAccountProps {
    _propsLoader?: any
    account: Model.Account.CallOfDuty
}

export const commaNum = (num:Number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
export const commaToFixed = (num:Number, decimals:number=0) => {
    const rounded = num.toFixed(decimals)
    const [wholes, decs] = rounded.split('.')
    const commaWholes = wholes.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    if (!decs) {
        return commaWholes
    }
    return `${commaWholes}.${decs}`
}

const CommandWrapper = styled.pre`
  position: absolute;
  top: -4em;
  right: 1.2em;
  background: #333;
  padding: 6px 18px;
  border-radius: 4px;
  color: #eee;

  i.icon-content_copy {
    float: right;
    position: relative;
    right: -9px;
    cursor: pointer;
    padding-left: 8px;
    border-left: 1px solid white;
    :hover {
      color: #5658dd;
    }
  }
`

export const CommandDisplay = ({ command }:{ command:string }) => (
  <CommandWrapper>
      {command}
      <i className="icon-content_copy report-hidden" title="Copy to clipboard" onClick={() => navigator?.clipboard?.writeText(command)} />
  </CommandWrapper>
)

