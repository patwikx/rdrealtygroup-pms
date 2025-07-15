import React from 'react'
import UsersPage from './components/settungs-dashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "RD Realty Group - Users",
  description: "Manage users and their roles",
}

const SettingsHomepage = () => {
  return (
    <div><UsersPage /></div>
  )
}

export default SettingsHomepage