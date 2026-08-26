'use client'
import React, { useContext } from 'react'
import { Context } from '../helper/Context'
import { BiMap, BiPhone, BiEnvelope, BiTimeFive } from 'react-icons/bi'
import { STORE_NAME } from '@/lib/secret'

const StoreLocation = () => {
  const { website } = useContext(Context)
  const storeName = STORE_NAME
  const storeAddress = website?.address || 'House 24, Road 12, Dhanmondi, Dhaka, Bangladesh'
  const storePhone = website?.phone || '+880 1712-345678'
  const storeEmail = website?.email || 'support@vanguard.com'

  return (
    <div className="w-full py-16 p-4 md:p-20 animate-fade-in">
      <div className="w-full flex flex-col lg:flex-row gap-10 items-stretch">

        <div className="flex-1 flex flex-col gap-6 justify-center">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-widest text-primary">
              Find Us
            </span>
            <h2 className="text-2xl md:text-3xl  text-slate-900 tracking-tight">
              Visit Our Outlet
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-lg shrink-0">
                <BiMap />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-700">Office & Store Address</span>
                <span className="text-slate-500 text-[11px] leading-normal">{storeAddress}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-lg shrink-0">
                <BiPhone />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-700">Phone Hotline</span>
                <span className="text-slate-500 text-[11px] leading-normal">{storePhone}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-lg shrink-0">
                <BiEnvelope />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-700">Email Channels</span>
                <span className="text-slate-500 text-[11px] leading-normal">{storeEmail}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-lg shrink-0">
                <BiTimeFive />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-slate-700">Store Hours</span>
                <span className="text-slate-500 text-[11px] leading-normal">Saturday – Thursday: 10:00 AM – 9:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-80 rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50 relative flex items-center justify-center p-6 text-center select-none shadow-sm">

          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="flex flex-col items-center gap-3 relative z-10">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white bg-primary text-2xl shadow-lg" >
              <BiMap />
            </div>
            <h4 className="font-semibold text-slate-800 text-sm">{storeName} Location Hub</h4>
            <p className="text-slate-500 text-[11px] max-w-xs leading-normal">
              Map integration loading. Visit Dhanmondi center located within major commercial shopping complex grids.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default StoreLocation