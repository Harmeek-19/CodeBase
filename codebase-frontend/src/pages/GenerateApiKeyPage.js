import React, { useState } from 'react'
import Layout from '../Navigation'
import { motion } from 'framer-motion'

export default function GeneratingAPIKeys() {
  const [apiKey, setApiKey] = useState('')

  const generateApiKey = () => {
    // This is a simple example. In a real application, you'd want to generate this server-side.
    const newApiKey = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    setApiKey(newApiKey)
  }

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-600">
          Generate API Key
        </h1>
        <div className="flex-grow bg-gray-100">

        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="mb-4">Click the button below to generate a new API key:</p>
          <button
            onClick={generateApiKey}
            className="bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:from-teal-600 hover:to-indigo-700 transition-colors"
          >
            Generate API Key
          </button>
          {apiKey && (
            <div className="mt-4">
              <p className="font-semibold">Your new API key:</p>
              <p className="bg-gray-100 p-2 rounded mt-2 font-mono">{apiKey}</p>
            </div>
          )}
        </div>
        </div>
      </motion.div>
    </Layout>
  )
}