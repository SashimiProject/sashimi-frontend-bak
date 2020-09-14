const CHAIN_ENV: string = process.env.REACT_APP_CHAIN_ENV || 'main';

interface CHAIN_INFO {
    chainId: number,
    rpcUrl: string,
    ethscanType: string
}

const CHAIN_ENV_MAP: any = {
    main: {
        chainId: 1,
        rpcUrl: 'https://mainnet.eth.aragon.network/',
        ethscanType: ''
    },
    kovan: {
        chainId: 42,
        rpcUrl: 'https://kovan.infura.io/',
        ethscanType: 'kovan.'
    }
};

export function getEthChainInfo(): CHAIN_INFO {
    return CHAIN_ENV_MAP[CHAIN_ENV];
};
