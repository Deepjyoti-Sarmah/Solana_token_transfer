import React from 'react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';


const header = () => {
    return (
        <div className='flex flex-row align-middle justify-evenly  bg-black text-white flex-grow'>
            <div className='flex flex-row items-center align-middle justify-start'>
                <div className='flex flex-grow-1 items-center justify-start'>
                    <a href="/" className=' text-2xl text-center font-extrabold '>
                        Solana Transfer
                    </a>
                </div>
                <div className='flex flex-row items-end '>
                    <button className='wallet-adapter-button wallet-adapter-button-trigger' type='button' tabIndex="0">Select Wallet</button>
                </div>
            </div>
        </div>
    )
}

export default header