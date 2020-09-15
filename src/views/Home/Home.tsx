import React from 'react'
import styled from 'styled-components'
import {
  Button
} from 'antd';
import {
  Link
} from 'react-router-dom';

import chef from '../../assets/img/chef.png'
import Container from '../../components/Container'
import Page from '../../components/Page'
import PageHeader from '../../components/PageHeader'
import Spacer from '../../components/Spacer'

import Balances from './components/Balances'

const Home: React.FC = () => {
  return (
    <Page>
      <PageHeader
        icon={<img src={chef} height={120} />}
        title="MasterChef is Ready"
        subtitle="Stake Uniswap LP tokens to claim your very own yummy SASHIMI!"
      />
      <Balances />
      <Spacer size="lg" />
      <Center>
        <Button size="large" type="primary">
          <Link to="/farms">
            See the Menu
          </Link>
        </Button>
      </Center>
    </Page>
  )
}

const Center = styled.div`
  margin: 0 auto;
`;

const StyledInfo = styled.h3`
  color: ${(props) => props.theme.color.grey[500]};
  font-size: 16px;
  font-weight: 400;
  margin: 0;
  padding: 0;
  text-align: center;

  > b {
    color: ${(props) => props.theme.color.grey[600]};
  }
`

export default Home
