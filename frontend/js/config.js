// IPFS Configuration
export const IPFS_CONFIG = {
    projectId: import.meta.env.VITE_IPFS_PROJECT_ID,
    projectSecret: import.meta.env.VITE_IPFS_PROJECT_SECRET
};

// Contract Configuration
export const CONTRACT_CONFIG = {
    address: import.meta.env.VITE_CONTRACT_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
};