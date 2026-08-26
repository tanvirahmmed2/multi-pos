
import { isManagementRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import React from 'react'

const HomeLayout = async({ children }) => {
  const auth= await isManagementRole()
  if(auth.success) return redirect('/dashboard')
  
  return (
    <div className='w-full overflow-x-hidden '>
      
      {children}
    </div>
  )
}

export default HomeLayout