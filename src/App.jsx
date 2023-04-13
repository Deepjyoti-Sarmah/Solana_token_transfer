import { Component, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AppBar from './components/AppBar'
import HomePage from './components/HomePage'
import Footer from './components/Footer'
import WalletContextProvider from './components/WalletContextProvider'



const App = () => {

  return (
    <>
      <WalletContextProvider cluster={'devnet'}>
        <AppBar />
        <HomePage />
        <Footer />
      </WalletContextProvider>
    </>
  )
}

export default App;
