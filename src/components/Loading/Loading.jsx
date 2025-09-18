import React from 'react';
import { Hospital } from 'lucide-react';
import './Loading.css';

const Loading = () => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <Hospital className="loading-icon" />
        <p className="loading-text">Loading Healthcare System...</p>
      </div>
    </div>
  );
};

export default Loading;