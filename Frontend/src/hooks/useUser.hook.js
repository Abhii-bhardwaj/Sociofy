import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import mitt from "mitt";

const emitter = mitt();

const useUser = () => {
  const [user, setUser] = useState(null);

  // ✅ 1. Emitter se turant data sync karega
  useEffect(() => {
    const userData = useAuthStore.getState().authUser;
    setUser(userData);

    // ✅ Emitter ka event listen karega
    const handleUserUpdate = (data) => {
      setUser(data);
    };

    emitter.on("USER_UPDATED", handleUserUpdate);

    // ✅ Clean-up
    return () => emitter.off("USER_UPDATED", handleUserUpdate);
  }, []);

  return user;
};

export default useUser;
