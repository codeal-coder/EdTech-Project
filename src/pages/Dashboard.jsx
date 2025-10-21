import { useSelector } from "react-redux"
import { Outlet } from "react-router-dom"

import Sidebar from "../components/core/Dashboard/Sidebar"

function Dashboard() {
  const { loading: profileLoading } = useSelector((state) => state.profile)
  const { loading: authLoading } = useSelector((state) => state.auth)

  if (profileLoading || authLoading) {
    return (
      <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] bg-richblack-800">
      <Sidebar />
      <div className="h-[calc(100vh-3.5rem)] flex-1 overflow-auto  bg-richblack-800">
        <div className="mx-auto w-11/12 max-w-[1000px] py-10 bg-richblack-800">
          <Outlet/>
        </div>
      </div>
    </div>
    // <div className="relative min-h-[calc(100vh-3.5rem)] bg-richblack-900">
    //   <Sidebar />
    //   <div className="ml-[220px] flex-1 overflow-auto bg-richblack-900">
    //     <div className="mx-auto w-11/12 max-w-[1000px] py-10">
    //       <Outlet />
    //     </div>
    //   </div>
    // </div>


  )
}

export default Dashboard