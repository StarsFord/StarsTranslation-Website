import React from 'react';
import './UploadProgress.css';

interface UploadProgressProps {
  current: number;
  total: number;
  fileName: string;
  percentage: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({ current, total, fileName, percentage }) => {
  if (total === 0) return null;

  return (
    <div className="upload-progress-overlay">
      <div className="upload-progress-modal">
        <h3>Uploading Files</h3>
        <div className="progress-info">
          <p className="file-name">{fileName}</p>
          <p className="progress-text">
            File {current} of {total} ({percentage}%)
          </p>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadProgress;
