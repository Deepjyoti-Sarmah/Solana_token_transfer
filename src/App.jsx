import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {

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
            <label htmlFor="recipientAddress"
              className='text-xl font-bold'
            >
              Enter recipient address
              <input type="text" placeholder="Enter Solana account address..."
                className='px-3 py-3 placeholder-blueGray-300 text-black relative bg-white rounded text-md border-0 shadow outline-none focus:outline-none focus:ring w-full' />
            </label>
          </div>
          <div className='w-11/12 md:w-6/12 mx-auto mb-3 text-white'>
            <label htmlFor="amount"
              className='text-xl font-bold'
            >
              Amount
              <input type="number" min="1" name="amount"
                className='px-3 py-3 text-gray-600 placeholder-blueGray-300 relative bg-white rounded text-md border-0 shadow outline-none focus:outline-none focus:ring w-full' />
            </label>
          </div>
          <div className='w-11/12 md:w-6/12 mx-auto mb-3 text-white'>
            <label htmlFor='selectedTokenAccount'
              className='text-xl font-bold'
            >
              Choose token
              <select id='selectedTokenAccount' name='selectedTokenAccount'
                className='px-3 py-3 text-gray-500 placeholder-blueGray-300 relative bg-white rounded text-md border-0 shadow outline-none focus:outline-none focus:ring w-full'>
                <option value="">
                  Select a token
                </option>
              </select>
            </label>
          </div>

          <div className='m-1 flex flex-col items-center'>
            <button type="submit"
              className='bg-blue-600  text-white active:bg-blue-800 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150'
            >Submit</button>
          </div>

        </form>
      </div >
    </>
  )
}

export default App
