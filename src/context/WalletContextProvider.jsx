import { clusterApiUrl } from '@solana/web3.js';
import { FC, ReactNode, useCallback, useMemo } from 'react';
import { WalletAdapterNetwork, WalletError } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider as ReactUIWalletModalProvider, WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
    BackpackWalletAdapter,
    Coin98WalletAdapter,
    ExodusWalletAdapter,
    LedgerWalletAdapter,
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    SolletWalletAdapter,
    TrustWalletAdapter,
} from '@solana/wallet-adapter-wallets';

import('@solana/wallet-adapter-react-ui/styles.css');

const WalletContextProvider = (props) => {

    const { children } = props;

    const network = WalletAdapterNetwork.Devnet;
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    const wallets = useMemo(
        () => [
            new BackpackWalletAdapter(),
            new PhantomWalletAdapter(),
            new ExodusWalletAdapter(),
            new SolflareWalletAdapter(),
            new SolletWalletAdapter(),
            new LedgerWalletAdapter(),
            new TrustWalletAdapter(),
            new Coin98WalletAdapter(),
        ],
        [network]
    );

    const onError = useCallback(
        (error) => {
            // notify({ type: 'error', message: error.message ? `${error.name}: ${error.message}` : error.name });
            console.error(error);
        },
        []
    );

    return (
        // TODO: updates needed for updating and referencing endpoint: wallet adapter rework
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} onError={onError} autoConnect>
                {/* <ReactUIWalletModalProvider>{children}</ReactUIWalletModalProvider> */}
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default WalletContextProvider;