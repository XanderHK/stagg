import styled from 'styled-components'

const Container = styled.footer`
    height: 3rem;
    margin: 0.5rem;
    text-align: center;
    a, a:hover, a:active, a:visited {
        position: relative;
        display: inline-block;
        color: inherit;
        text-decoration: none !important;
        font-size: 2rem;
        color: white;
        padding: 0.5rem;
        max-height: 3rem;
        overflow: hidden;
    }
    // a::after {
    //     z-index: 0;
    //     position: absolute;
    //     content: '';
    //     top: 0.75rem;
    //     display: block;
    //     height: 1.5rem;
    //     width: 1.5rem;
    //     background: green;
    //     border-radius: 50%;
    // }
`

export default () => {
    return (
        <Container>
            <a href="https://discord.me/ggez" target="_blank">
                <i className="icon-discord" />
            </a>
            <a href="https://github.com/staggr" target="_blank">
                <i className="icon-github" />
            </a>
        </Container>
    )
}