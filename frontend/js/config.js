// IPFS Configuration
export const IPFS_CONFIG = {
    projectId: import.meta.env.VITE_IPFS_PROJECT_ID,
    projectSecret: import.meta.env.VITE_IPFS_PROJECT_SECRET
};

// Contract Configuration
export const CONTRACT_CONFIG = {
    address: import.meta.env.VITE_CONTRACT_ADDRESS || '0xA696cF49e9C355E098bED7B2d60F4F6E785A6857'
};