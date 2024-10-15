import React, { createContext, useState, useContext } from 'react';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [locations, setLocations] = useState(['Mill', 'Godown']);

  const addLocation = (newLocation) => {
    setLocations(prevLocations => [...new Set([...prevLocations, newLocation])]);
  };

  return (
    <LocationContext.Provider value={{ locations, addLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocations = () => useContext(LocationContext);