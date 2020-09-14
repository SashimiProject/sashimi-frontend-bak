import React, { useCallback, useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import {
  Layout
} from 'antd';
import styled, { ThemeProvider } from 'styled-components'
import { UseWalletProvider } from 'use-wallet'

import DisclaimerModal from './components/DisclaimerModal'
import MobileMenu from './components/MobileMenu'
import TopBar from './components/TopBar'
import SashimiFooter from './components/Footer';

import FarmsProvider from './contexts/Farms'
import ModalsProvider from './contexts/Modals'
import YamProvider from './contexts/YamProvider'
import TransactionProvider from './contexts/Transactions'

import useModal from './hooks/useModal'

import FAQ from './views/FAQ'
import Farms from './views/Farms'
import Home from './views/Home'

import { getEthChainInfo } from './utils/getEthChainInfo'

import theme from './theme'
import './App.less';

const {
  Header,
  Content,
  Footer
} = Layout;

const App: React.FC = () => {
  const [mobileMenu, setMobileMenu] = useState(false)

  const handleDismissMobileMenu = useCallback(() => {
    setMobileMenu(false)
  }, [setMobileMenu])

  const handlePresentMobileMenu = useCallback(() => {
    setMobileMenu(true)
  }, [setMobileMenu])

  return (
    <Providers>
      <Router>
        <Layout>
          <StyledHeader>
            <TopBar onPresentMobileMenu={handlePresentMobileMenu} />
          </StyledHeader>
          <StyledContent>
            <MobileMenu onDismiss={handleDismissMobileMenu} visible={mobileMenu} />
            <Switch>
              <Route path="/" exact>
                <Home />
              </Route>
              <Route path="/farms">
                <Farms />
              </Route>
              <Route path="/faq">
                <FAQ />
              </Route>
            </Switch>
          </StyledContent>
          <Footer>
            <SashimiFooter />
            <Disclaimer />
          </Footer>
        </Layout>
      </Router>
    </Providers>
  )
}

// https://infura.io/docs/gettingStarted/chooseaNetwork
// https://www.anyblockanalytics.com/news/overview-ethereum-blockchain-networks/
const Providers: React.FC = ({ children }) => {

  const {
    chainId,
    rpcUrl
  } = getEthChainInfo();

  return (
    <ThemeProvider theme={theme}>
      <UseWalletProvider
        chainId={chainId}
        connectors={{
          walletconnect: { rpcUrl },
        }}
      >
        <YamProvider>
          <TransactionProvider>
            <FarmsProvider>
              <ModalsProvider>{children}</ModalsProvider>
            </FarmsProvider>
          </TransactionProvider>
        </YamProvider>
      </UseWalletProvider>
    </ThemeProvider>
  )
}

const Disclaimer: React.FC = () => {
  const markSeen = useCallback(() => {
    localStorage.setItem('disclaimer', 'seen')
  }, [])

  const [onPresentDisclaimerModal] = useModal(
    <DisclaimerModal onConfirm={markSeen} />,
  )

  useEffect(() => {
    const seenDisclaimer = true // localStorage.getItem('disclaimer')
    if (!seenDisclaimer) {
      onPresentDisclaimerModal()
    }
  }, [])

  return <div />
}

const StyledContent = styled(Content)`
  min-width: 1200px;
  padding: 0 64px;
  margin: 24px auto;
  background-color: #ffffff;
`

const StyledHeader = styled(Header)`
  background-color: #ffffff;
`

export default App
