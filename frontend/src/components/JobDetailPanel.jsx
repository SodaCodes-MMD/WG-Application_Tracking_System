//scrum 37 
import "./JobDetailPanel.css";

export default function JobDetailPanel({ job, onClose }) {
    return (
        <div className= "jdp-overlay" onClick={onClose}>
            <div className="jdp-panel" onClick={e => e.stopPropagation()}>

                <div className="jdp-header">
                    <button className="jdp-back" onClick={onClose}> Back </button>
                    <div className="jdp-title">
                        <h2>{job.title}</h2>
                        <p>{job.company}</p>
                    </div>
                </div>
                <div className="jdp-body">
                    <p>Overview coming soon... Scrum 38</p>
                </div>
                
            </div>
        </div>
    );
}