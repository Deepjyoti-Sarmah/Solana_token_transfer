import { Metadata } from '@metaplex-foundation/mpl-token-metadata';
import {
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    TokenAccountNotFoundError,
    TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { TokenListProvider } from '@solana/spl-token-registry';
import { WalletAdapterNetwork, WalletNotConnectedError } from '@solana/wallet-adapter-base';
// import { ConnectionProvider, useConnection, useWallet, WalletProvider } from '@solana/wallet-adapter-react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import {
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    SystemProgram,
    Transaction,
} from '@solana/web3.js';
import axios from 'axios';
import React, { FC, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// interface TokenAccount {
//     mintAddress: string;
//     tokenBalance: number;
//     decimals: number;
//     uri: string;
//     symbol: string;
// }

// type SeverityType = 'error' | 'success' | 'info';
const SOL = 'SOL';

// type StatusType = {
//     severity: SeverityType;
//     status: 'pending' | 'success' | 'error';
//     message: string;
// };


const HomePage = () => {

    const [status, setStatus] = useState({ severity: 'success', status: 'success', message: '' });
    const [walletAddress, setWalletAddress] = useState('');
    const [walletError, setWalletError] = useState('');
    const [tokenAccounts, setTokenAccounts] = useState([]);
    const [selectedOption, setSelectedOption] = useState('');
    const [selectedToken, setSelectedToken] = useState({
        mintAddress: '',
        symbol: '',
        tokenBalance: 0,
        uri: '',
        decimals: 9,
    });
    const [amount, setAmount] = useState('0');
    const [amountError, setAmountError] = useState(false);
    const [signature, setSignature] = useState('');
    const [open, setOpen] = useState(false);

    const { publicKey, sendTransaction } = useWallet();
    const { connection } = useConnection();

    const walletAddressRef = useRef < HTMLInputElement > (null);
    const amountRef = useRef < HTMLInputElement > (null);

    useEffect(() => {
        const amt = amountRef?.current?.value;
        if (!selectedToken.mintAddress) return;
        if (!amt) {
            return;
        }
        console.log(selectedToken.tokenBalance, amt);
        const isAmountLessThanBalance = parseFloat(amt) > 0 && parseFloat(amt) <= selectedToken.tokenBalance;
        setAmountError(!isAmountLessThanBalance);
    }, [selectedToken, publicKey]);

    useEffect(() => {
        setOpen(true);
        return () => {
            setOpen(false);
        };
    }, [status]);

    useEffect(() => {
        if (publicKey && publicKey.toBase58() === walletAddressRef?.current?.value) {
            setWalletError('Cannot send to the same wallet');
        } else {
            setWalletError('');
        }
    }, [publicKey]);

    useEffect(() => {
        if (!publicKey) return;

        async function getTokenAccounts(wallet, connection) {
            if (publicKey) {
                connection.getBalance(publicKey).then((bal) => {
                    const sol = {
                        symbol: SOL,
                        mintAddress: SOL,
                        uri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
                        tokenBalance: bal / LAMPORTS_PER_SOL,
                        decimals: 9,
                    };
                    setTokenAccounts((prevTokenAccounts) => [...prevTokenAccounts, sol]);
                });
            }
            const provider = new TokenListProvider();
            const tokenList = await provider.resolve();

            const filters = [
                {
                    dataSize: 165, //size of account (bytes)
                },
                {
                    memcmp: {
                        offset: 32, //location of our query in the account (bytes)
                        bytes: wallet, //our search criteria, a base58 encoded string
                    },
                },
            ];

            try {
                const accounts = await connection.getParsedProgramAccounts(
                    TOKEN_PROGRAM_ID,
                    { filters: filters }
                );
                const parsedAccounts = await Promise.all(
                    accounts.map(async (account) => {
                        try {
                            const parsedAccountInfo = account.account.data;
                            const mintAddress = parsedAccountInfo['parsed']['info']['mint'];
                            const tokenBalance = parsedAccountInfo['parsed']['info']['tokenAmount']['uiAmount'];
                            const decimals = parsedAccountInfo['parsed']['info']['tokenAmount']['decimals'];
                            let entry = {};

                            const tokenInfo = tokenList
                                .filterByClusterSlug('devnet')
                                .getList()
                                .find((info) => info.address === mintAddress);

                            if (tokenInfo) {
                                entry = { ...entry, uri: tokenInfo?.logoURI, symbol: tokenInfo?.symbol };
                            } else {
                                let mintPubkey = new PublicKey(mintAddress);
                                try {
                                    let tokenmetaPubkey = await Metadata.getPDA(mintPubkey);
                                    const tokenmeta = await Metadata.load(connection, tokenmetaPubkey);
                                    const uri = await axios.get(tokenmeta.data?.data?.uri);
                                    entry = {
                                        ...entry,
                                        symbol: tokenmeta.data?.data?.symbol,
                                        uri: uri.data.image,
                                    };
                                } catch (error) {
                                    entry = { ...entry, uri: '', symbol: mintAddress };
                                }
                            }

                            return entry;
                        } catch (error) {
                            console.error(error);
                        }
                    })
                );

                const filteredAccounts = parsedAccounts.filter((account) => account);
                setTokenAccounts((prevTokenAccounts) => [...prevTokenAccounts, ...filteredAccounts]);
            } catch (error) {
                console.error(error);
            }
        }

        getTokenAccounts(publicKey.toString(), connection);

        return () => {
            setTokenAccounts([]);
        };
    }, [publicKey, connection, signature]);

    const handleChange = (event, child) => {
        setSelectedOption(event.target.value);
        const token = tokenAccounts.find((token) => token.mintAddress === event.target.value);
        setSelectedToken(token || { mintAddress: '', symbol: '', tokenBalance: 0, uri: '', decimals: 9 });
    };

    const handleAmountChange = (event) => {
        const inputAmount = event.target.value.trim();
        if (!inputAmount) {
            setAmountError(true);
            setAmount(inputAmount);
        } else if (!/^(?!0$)\d*(.\d+)?$/.test(inputAmount)) {
            setAmountError(true);
            setAmount(inputAmount);
        } else {
            const amount = parseFloat(inputAmount);
            if (selectedToken.mintAddress && amount > selectedToken.tokenBalance) {
                setAmountError(true);
            } else {
                setAmountError(false);
            }
            setAmount(inputAmount);
        }
    };

    const handleAddressChange = (event) => {
        const address = event.target.value.trim();
        setWalletAddress(address);
        try {
            new PublicKey(address);
            setWalletError('');
        } catch {
            // Set error state only if input length is not zero
            setWalletError(address.length > 0 ? 'Invalid wallet address' : '');
        }

        // Check if address matches publicKey
        if (publicKey && publicKey.toBase58() === address) {
            setWalletError('Cannot send to the same wallet');
        }
    };

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };

    function confirmAction() {
        return new Promise((resolve, reject) => {
            const modalRoot = document.createElement('div');
            modalRoot.style.cssText =
                'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; display: flex; justify-content: center; align-items: center; background-color: rgba(0, 0, 0, 0.5);';
            const modalContent = document.createElement('div');
            modalContent.style.cssText =
                'background-color: #212121; padding: 24px; border-radius: 8px; width: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);';

            const message = document.createElement('p');
            message.style.cssText = 'color: #FF0000; margin: 0 0 16px 0; font-size: 1.2rem;';
            message.textContent =
                'The recipient wallet address does not have an account for this token. Would you like to create it for them?';

            const buttonWrapper = document.createElement('div');
            buttonWrapper.style.cssText = 'display: flex; justify-content: flex-end;';

            const confirmButton = document.createElement('button');
            confirmButton.style.cssText =
                'background-color: #48C1F7; color: #1E1E1E; padding: 12px 24px; border-radius: 8px; margin-right: 16px; cursor: pointer; font-size: 1.2rem; border: none; outline: none;';
            confirmButton.textContent = 'Yes';

            const cancelButton = document.createElement('button');
            cancelButton.style.cssText =
                'background-color: #48C1F7; color: #1E1E1E; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; border: none; outline: none;';
            cancelButton.textContent = 'No';

            modalRoot.addEventListener('click', () => {
                reject('Action cancelled.');
                document.body.removeChild(modalRoot);
            });

            modalContent.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            confirmButton.addEventListener('click', () => {
                resolve(true);
                document.body.removeChild(modalRoot);
            });

            cancelButton.addEventListener('click', () => {
                reject('Action cancelled.');
                document.body.removeChild(modalRoot);
            });

            modalContent.appendChild(message);
            buttonWrapper.appendChild(confirmButton);
            buttonWrapper.appendChild(cancelButton);
            modalContent.appendChild(buttonWrapper);
            modalRoot.appendChild(modalContent);
            document.body.appendChild(modalRoot);
        })
    };

    const sendAndConfirmTransaction = async (transaction, connection) => {
        try {
            const signature = await sendTransaction(transaction, connection);
            setStatus({
                status: 'pending',
                severity: 'info',
                message: `Transaction sent for ID ${signature}!`,
            });
            console.log('Transaction sent:', signature);
            const latestBlockHash = await connection.getLatestBlockhash();
            const confirmation = await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signature,
            });
            if (confirmation) {
                setStatus({
                    status: 'success',
                    severity: 'success',
                    message: `Transaction confirmed for ID ${signature}!`,
                });
                setSignature(signature);
            }
        } catch (error) {
            setStatus({
                status: 'error',
                severity: 'error',
                message: `Transaction failed!`,
            });
        }
    };

    const Transact = async () => {
        //Transaction For SOL Native Token
        if (selectedToken.mintAddress === SOL) {
            try {
                if (!publicKey) throw new WalletNotConnectedError();
                const balance = await connection.getBalance(publicKey);
                console.log(balance / LAMPORTS_PER_SOL);
                const toPublicKey = new PublicKey(walletAddress);
                console.log(parseFloat(amount) * LAMPORTS_PER_SOL);
                const transaction = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: publicKey,
                        toPubkey: toPublicKey,
                        lamports: parseFloat(amount) * LAMPORTS_PER_SOL, // 1 SOL = 1 billion lamports
                    })
                );
                await sendAndConfirmTransaction(transaction, connection);
            } catch (error) {
                setStatus({
                    status: 'error',
                    severity: 'error',
                    message: `Transaction failed!`,
                });
            }
        } else {
            //Transaction For SPL-Token
            try {
                if (!publicKey) throw new WalletNotConnectedError();
                let sourceAccount = await getOrCreateAssociatedTokenAccount(
                    connection,
                    Keypair.generate(),
                    new PublicKey(selectedToken.mintAddress),
                    publicKey
                );
                console.log(`Source Account: ${sourceAccount.address.toString()}`);
                try {
                    let destinationAccount = await getOrCreateAssociatedTokenAccount(
                        connection,
                        Keypair.generate(),
                        new PublicKey(selectedToken.mintAddress),
                        new PublicKey(walletAddress)
                    );
                    console.log(`Destination Account: ${destinationAccount.address.toString()}`);
                    //send transaction directly now
                    const transaction = new Transaction();
                    transaction.add(
                        createTransferInstruction(
                            sourceAccount.address,
                            destinationAccount.address,
                            publicKey,
                            parseFloat(amount) * Math.pow(10, selectedToken.decimals)
                        )
                    );
                    await sendAndConfirmTransaction(transaction, connection);
                } catch (error) {
                    //else create destination account and then send transaction
                    if (error instanceof TokenAccountNotFoundError) {
                        const userConfirmed = await confirmAction();
                        if (!userConfirmed) {
                            throw error;
                        }
                        let ata = await getAssociatedTokenAddress(
                            new PublicKey(selectedToken.mintAddress), // mint
                            new PublicKey(walletAddress), // owner
                            false // allow owner off curve
                        );
                        console.log(`ata: ${ata.toBase58()}`);
                        const tx = new Transaction().add(
                            createAssociatedTokenAccountInstruction(
                                publicKey, // payer
                                ata, // ata
                                new PublicKey(walletAddress), // owner
                                new PublicKey(selectedToken.mintAddress)
                            )
                        );
                        console.log(`create ata txhash: ${await sendAndConfirmTransaction(tx, connection)}`);
                        //create destination account and then send transaction
                        let destinationAccount = await getOrCreateAssociatedTokenAccount(
                            connection,
                            Keypair.generate(),
                            new PublicKey(selectedToken.mintAddress),
                            new PublicKey(walletAddress)
                        );
                        console.log(` Destination Account: ${destinationAccount.address.toString()}`);
                        const transaction = new Transaction();
                        transaction.add(
                            createTransferInstruction(
                                sourceAccount.address,
                                destinationAccount.address,
                                publicKey,
                                parseFloat(amount) * Math.pow(10, selectedToken.decimals)
                            )
                        );
                        await sendAndConfirmTransaction(transaction, connection);
                    }
                }
            } catch (error) {
                setStatus({
                    status: 'error',
                    severity: 'error',
                    message: `Transaction failed!`,
                });
            }
        }
    };


    return (
        <>
            <div className='bg-gradient-to-b from-gray-600 to-gray-950 min-h-screen text-white flex flex-col '>
                <form >
                    <div className='container mx-auto max-w-7xl pt-20 md:pt-64 pb-12 px-4 text-center flex-grow-0'>
                        <h1 className='text-3xl md:text-5xl font-extrabold tracking-tight'>
                            <span className='bg-clip-text text-transparent bg-gradient-to-b from-purple-300 to-blue-500'>
                                Solana Transfer
                            </span>
                        </h1>
                    </div>
                    <div className='w-11/12 md:w-6/12 mx-auto mb-3 text-white'>
                        <label htmlFor="recipientAdress"
                            className='text-xl font-bold' >
                            Enter recipient adress
                            <input type="text" name="recipientAdress" placeholder='Enter address'
                                value={walletAddress}
                                onChange={handleAddressChange}
                                className='px-3 py-3 text-gray-600 placeholder-blueGray-300 relative bg-white rounded text-md border-0 shadow outline-none focus:outline-none focus:ring w-full'
                            />
                        </label>
                    </div>
                    <div className='w-11/12 md:w-6/12 mx-auto mb-3 text-white'>
                        <label htmlFor="amount"
                            className='text-xl font-bold'
                        >
                            Amount
                            <input type="number" name="amount"
                                className='px-3 py-3 text-gray-600 placeholder-blueGray-300 relative bg-white rounded text-md border-0 shadow outline-none focus:outline-none focus:ring w-full'
                                value={amount}
                                onChange={handleAmountChange}
                            />
                        </label>
                    </div>
                    <div className='w-11/12 md:w-6/12 mx-auto mb-3 text-white'>
                        <label htmlFor='selectedTokenAccount'
                            className='text-xl font-bold'
                        >
                            Choose token
                            <select id='selectedTokenAccount' name='selectedTokenAccount'
                                className='px-3 py-3 text-gray-500 placeholder-blueGray-300 relative bg-white rounded text-md border-0 shadow outline-none focus:outline-none focus:ring w-full'
                                value={selectedOption}
                                onChange={handleChange}
                            >
                                <option ey={-1} value={-1}>
                                    Select a token
                                </option>
                                {tokenAccounts.map((account, i) => {
                                    return (
                                        <option
                                            className='text-black'
                                            key={i}
                                            value={JSON.stringify(account)} >
                                            {account.name}
                                        </option>
                                    )
                                })}

                            </select>
                        </label>
                    </div>
                    <div className='m-1 flex flex-col items-center'>
                        <button type="submit"
                            // value={JSON.parse(formData.selectedTokenAccount).tokenBalance}
                            className='bg-blue-600  text-white active:bg-blue-800 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150'
                            onClick={(event) => Transact()}
                            disabled={walletError || amountError || !walletAddress.length || !selectedToken.mintAddress}
                        >Submit</button>
                    </div>
                </form>
            </div >
        </>
    );
};

export default HomePage;