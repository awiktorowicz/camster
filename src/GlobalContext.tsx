import React, {createContext, useEffect, useState, FC, Children} from "react";

export const GlobalContext = createContext<any | null>(null);
export const useGlobalContext = (): any => React.useContext(GlobalContext);

interface PostsContextProviderProps {
    children: JSX.Element | JSX.Element[]
}

const GlobalContextProvider = ({ children }: PostsContextProviderProps) => {
    const [globalData, setGlobalData] = useState<any | null>();
    return (
        <GlobalContext.Provider value={[globalData, setGlobalData]}>
            {children}
        </GlobalContext.Provider>
    );
}

export default GlobalContextProvider;