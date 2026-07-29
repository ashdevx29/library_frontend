import React, { useState } from 'react';
import SeatGrid from './SeatGrid';
import SeatList from './SeatList';

const SeatsPage = () => {
  const [view, setView] = useState('grid');
  return view === 'grid' ? <SeatGrid setView={setView} /> : <SeatList setView={setView} />;
};

export default SeatsPage;
