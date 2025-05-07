// IPFS/Pinata Service
class IPFSService {
    constructor() {
        this.apiKey = import.meta.env.VITE_IPFS_PROJECT_ID;
        this.apiSecret = import.meta.env.VITE_IPFS_PROJECT_SECRET;
        this.baseURL = 'https://api.pinata.cloud';
    }

    async uploadToIPFS(data) {
        try {
            const formData = new FormData();
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            formData.append('file', blob);

            const response = await fetch(`${this.baseURL}/pinning/pinFileToIPFS`, {
                method: 'POST',
                headers: {
                    'pinata_api_key': this.apiKey,
                    'pinata_secret_api_key': this.apiSecret,
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Failed to upload to IPFS: ${response.statusText}`);
            }

            const result = await response.json();
            return `ipfs://${result.IpfsHash}`;
        } catch (error) {
            console.error('Error uploading to IPFS:', error);
            throw error;
        }
    }

    async getFromIPFS(ipfsHash) {
        try {
            // Remove ipfs:// prefix if present
            const hash = ipfsHash.replace('ipfs://', '');
            const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching from IPFS:', error);
            throw error;
        }
    }
}

export const ipfsService = new IPFSService();