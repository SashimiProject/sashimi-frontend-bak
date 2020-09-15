import React, {useCallback, useEffect, useState} from 'react'
import {
  Button,
  Divider,
  Row,
  Col
} from 'antd';
import {
  Link
} from 'react-router-dom';
import styled, {keyframes} from 'styled-components'
import Countdown, {CountdownRenderProps} from 'react-countdown'
import {useWallet} from 'use-wallet'
import numeral from 'numeral'


import Card from '../../../components/Card'
import CardContent from '../../../components/CardContent'
import CardIcon from '../../../components/CardIcon'
import Loader from '../../../components/Loader'
import Spacer from '../../../components/Spacer'

import useFarms from '../../../hooks/useFarms'
import useYam from '../../../hooks/useYam'
import BigNumber from 'bignumber.js'

import {Farm} from '../../../contexts/Farms'

import {bnToDec} from '../../../utils'
import {getEarned, getMasterChefContract} from '../../../sushi/utils'
import useAllStakedValue, {
  StakedValue,
} from '../../../hooks/useAllStakedValue'

import {BASIC_TOKEN} from '../../../constants/config';
import uni from '../../../assets/img/logo_uniswap.png';

interface FarmWithStakedValue extends Farm, StakedValue {
  apy: BigNumber,
  allocPoint: BigNumber
  totalAllocPoint: BigNumber
}

const UniLogo = () => (
  <StyledLogo src={uni} />
)

const StyledLogo = styled.img`
  height: 16px;
  margin-top: -4px;
  margin-right: 2px;
`

let burnPoolPercent: BigNumber = new BigNumber(0);

const FarmCards: React.FC = () => {
  const [farms] = useFarms()
  const {account} = useWallet()
  const stakedValue = useAllStakedValue()

  const sushiIndex = farms.findIndex(
    ({tokenSymbol}) => tokenSymbol === BASIC_TOKEN,
  )

  const sushiPrice =
    sushiIndex >= 0 && stakedValue[sushiIndex]
      ? stakedValue[sushiIndex].tokenPriceInWeth
      : new BigNumber(0)

  const BLOCKS_PER_YEAR = new BigNumber(2336000)
  // TODO: After block height xxxx, SUSHI_PER_BLOCK = 100;
  const SASHIMI_PER_BLOCK = new BigNumber(1000)

  let ethValueInSashimiNoWeight = new BigNumber(0);
  const rows = farms.reduce<FarmWithStakedValue[][]>(
    (farmRows, farm, i) => {
      const newFarmRows = [...farmRows]
      // Do not show burn pool
      if (farm.pid === 11) {
        if (stakedValue[i] && !stakedValue[i].totalAllocPoint.isEqualTo(0)) {
          burnPoolPercent = stakedValue[i].allocPoint.div(stakedValue[i].totalAllocPoint);
        }
        return newFarmRows;
      }

      const notETHTokenPair = [10, 12, 13, 14, 15, 16].includes(farm.pid);
      // TODO: Better code to get weth value of tokenNotEth-tokenNotEth
      if (stakedValue[i] && !notETHTokenPair ) {
        ethValueInSashimiNoWeight = ethValueInSashimiNoWeight.plus(stakedValue[i].totalWethValue);
      }

      let stakedValueCurrentTotalWethValue = stakedValue[i] && stakedValue[i].totalWethValue;
      if (stakedValue[i] && notETHTokenPair && stakedValue[i].totalWethValue.toNumber() === 0) {
        stakedValueCurrentTotalWethValue = stakedValue[i].tokenAmount.times(sushiPrice).times(new BigNumber(2)) || new BigNumber(0);
        ethValueInSashimiNoWeight = ethValueInSashimiNoWeight.plus(stakedValueCurrentTotalWethValue);
      }

      let farmWithStakedValue = {
        ...farm,
        ...stakedValue[i],
        apy: stakedValue[i]
          ? sushiPrice
            .times(SASHIMI_PER_BLOCK)
            .times(BLOCKS_PER_YEAR)
            .times(stakedValue[i].poolWeight)
            .div(stakedValueCurrentTotalWethValue)
          : null,
      }

      if (newFarmRows[newFarmRows.length - 1].length === 3) {
        newFarmRows.push([farmWithStakedValue])
      } else {
        newFarmRows[newFarmRows.length - 1].push(farmWithStakedValue)
      }
      return newFarmRows
    },
    [[]],
  )

  return (
    <StyledCards>
      <ValueETH>{ethValueInSashimiNoWeight.toNumber().toFixed(2)} WETH valued assets are making Sashimi</ValueETH>
      {!!rows[0].length ? (
        rows.map((farmRow, i) => (
          <StyledRow key={i}>
            {farmRow.map((farm, j) => (
              <React.Fragment key={j}>
                <FarmCard farm={farm}/>
                {(j === 0 || j === 1) && <StyledSpacer/>}
              </React.Fragment>
            ))}
          </StyledRow>
        ))
      ) : (
        <StyledLoadingWrapper>
          <Loader text="Cooking the rice ..."/>
        </StyledLoadingWrapper>
      )}
    </StyledCards>
  )
}

interface FarmCardProps {
  farm: FarmWithStakedValue
}

const FarmCard: React.FC<FarmCardProps> = ({farm}) => {
  const [startTime, setStartTime] = useState(0)
  const [harvestable, setHarvestable] = useState(0)

  const {account} = useWallet()
  const {lpTokenAddress} = farm
  const yam = useYam()

  const renderer = (countdownProps: CountdownRenderProps) => {
    const {hours, minutes, seconds} = countdownProps
    const paddedSeconds = seconds < 10 ? `0${seconds}` : seconds
    const paddedMinutes = minutes < 10 ? `0${minutes}` : minutes
    const paddedHours = hours < 10 ? `0${hours}` : hours
    return (
      <span style={{width: '100%'}}>
        {paddedHours}:{paddedMinutes}:{paddedSeconds}
      </span>
    )
  }

  useEffect(() => {
    async function fetchEarned() {
      if (yam) return
      const earned = await getEarned(
        getMasterChefContract(yam),
        lpTokenAddress,
        account,
      )
      setHarvestable(bnToDec(earned))
    }

    if (yam && account) {
      fetchEarned()
    }
  }, [yam, lpTokenAddress, account, setHarvestable])

  const poolActive = true // startTime * 1000 - Date.now() <= 0

  let farmApy: any;
  let farmPool: any;
  if (farm.apy && farm.apy.isNaN()) {
    farmApy = '- %';
  } else {
    farmApy = farm.apy
      ? `${farm.apy
        .times(new BigNumber(100))
        .toNumber()
        .toLocaleString('en-US')
        .slice(0, -1) || '-'}%`
      : 'Loading ...';
  }
  if (farm.allocPoint && farm.totalAllocPoint
    && !farm.allocPoint.isEqualTo(0)
    && !farm.totalAllocPoint.isEqualTo(0) && !burnPoolPercent.isEqualTo(0)) {
    const calibrationParam: BigNumber = (new BigNumber(1)).minus(burnPoolPercent);
    farmPool = `${farm.allocPoint.times(100).div(calibrationParam).div(farm.totalAllocPoint).toFixed(2)}%`;
  } else {
    farmPool = '- %';
  }

  return (
    <StyledCardWrapper>
      {farm.tokenSymbol === 'SASHIMI' && <StyledCardAccent/>}
      <Card>
        <CardContent>
          <StyledContent>
            <CardIcon>{farm.icon}</CardIcon>
            <StyledTitle>{farm.name}</StyledTitle>
            <StyledDetails>
              <StyledDetail>Deposit {farm.lpToken.toUpperCase()}</StyledDetail>
              <StyledDetail>Earn {farm.earnToken.toUpperCase()} ({farmPool} Pool)</StyledDetail>
            </StyledDetails>
            <Spacer/>
            <ButtonContainer>
              <Col span={11}>
                <Button
                  size="large"
                  type="primary"
                  disabled={!poolActive}
                  block
                >
                  <Link to={`/farms/${farm.id}`}>
                    {
                      poolActive ? 'Select' : (
                        <Countdown
                          date={new Date(startTime * 1000)}
                          renderer={renderer}
                        />
                      )
                    }
                  </Link>
                </Button>
              </Col>
              <Col span={11} offset={2}>
                <Button
                  size="large"
                  type="primary"
                  href={`https://uniswap.info/pair/${farm.lpTokenAddress}`}
                  target="_blank"
                  block
                >
                  <UniLogo /> GET LP
                </Button>
              </Col>
            </ButtonContainer>
            <StyledDivider />
            <StyledInsight>
              <span>APY</span>
              <span>
                {farmApy}
              </span>
              {/* <span>
                {farm.tokenAmount
                  ? (farm.tokenAmount.toNumber() || 0).toLocaleString('en-US')
                  : '-'}{' '}
                {farm.tokenSymbol}
              </span>
              <span>
                {farm.wethAmount
                  ? (farm.wethAmount.toNumber() || 0).toLocaleString('en-US')
                  : '-'}{' '}
                ETH
              </span> */}
            </StyledInsight>
          </StyledContent>
        </CardContent>
      </Card>
    </StyledCardWrapper>
  )
}

const RainbowLight = keyframes`

	0% {
		background-position: 0% 50%;
	}
	50% {
		background-position: 100% 50%;
	}
	100% {
		background-position: 0% 50%;
	}
`

const ValueETH = styled.div`
  color: #aa9585;
  font-size: 18px;
  font-weight: 400;
  margin: 0;
  padding: 0;
  text-align: center;
  padding-bottom: ${(props) => props.theme.spacing[6]}px;
`

const ButtonContainer = styled(Row)`
  width: 100%;
`

const StyledCardAccent = styled.div`
  background: linear-gradient(
    45deg,
    rgba(255, 0, 0, 1) 0%,
    rgba(255, 154, 0, 1) 10%,
    rgba(208, 222, 33, 1) 20%,
    rgba(79, 220, 74, 1) 30%,
    rgba(63, 218, 216, 1) 40%,
    rgba(47, 201, 226, 1) 50%,
    rgba(28, 127, 238, 1) 60%,
    rgba(95, 21, 242, 1) 70%,
    rgba(186, 12, 248, 1) 80%,
    rgba(251, 7, 217, 1) 90%,
    rgba(255, 0, 0, 1) 100%
  );
  background-size: 300% 300%;
  animation: ${RainbowLight} 2s linear infinite;
  border-radius: 12px;
  filter: blur(6px);
  position: absolute;
  top: -2px;
  right: -2px;
  bottom: -2px;
  left: -2px;
  z-index: 0;
`

const StyledCards = styled.div`
  width: 900px;
  @media (max-width: 768px) {
    width: 100%;
  }
`

const StyledLoadingWrapper = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  justify-content: center;
`

const StyledRow = styled.div`
  display: flex;
  margin-bottom: ${(props) => props.theme.spacing[4]}px;
  flex-flow: row wrap;
  @media (max-width: 768px) {
    width: 100%;
    flex-flow: column nowrap;
    align-items: center;
  }
`

const StyledCardWrapper = styled.div`
  display: flex;
  width: calc((900px - ${(props) => props.theme.spacing[4]}px * 2) / 3);
  position: relative;
`

const StyledTitle = styled.h4`
  color: ${(props) => props.theme.color.grey[600]};
  font-size: 24px;
  font-weight: 700;
  margin: ${(props) => props.theme.spacing[2]}px 0 0;
  padding: 0;
  display: flex;
  align-items: center;
`

const StyledContent = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`

const StyledSpacer = styled.div`
  height: ${(props) => props.theme.spacing[4]}px;
  width: ${(props) => props.theme.spacing[4]}px;
`

const StyledDetails = styled.div`
  margin-top: ${(props) => props.theme.spacing[2]}px;
  text-align: center;
`

const StyledDetail = styled.div`
  color: ${(props) => props.theme.color.grey[500]};
`

const StyledInsight = styled.div`
  display: flex;
  justify-content: space-between;
  box-sizing: border-box;
  color: ${(props) => props.theme.color.grey[400]};
  width: 100%;
  line-height: 32px;
  font-size: 14px;
  text-align: center;
  padding: 0 12px;
`

const StyledDivider = styled(Divider)`
  margin-top: 12px;
  margin-bottom:  7px;
`

export default FarmCards
