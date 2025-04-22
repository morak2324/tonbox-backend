export interface Transaction {
  hash: string;
  utime: number;
  fee: string;
  storageFee: string;
  otherFee: string;
  transaction_type: string;
  in_msg: {
    source: string;
    destination: string;
    value: string;
    fwd_fee: string;
    ihr_fee: string;
    created_lt: string;
    body_hash: string;
  };
  out_msgs: Array<{
    source: string;
    destination: string;
    value: string;
    fwd_fee: string;
    ihr_fee: string;
    created_lt: string;
    body_hash: string;
  }>;
}

export interface Jetton {
  balance: string;
  verification_status: string;
  metadata: {
    name: string;
    symbol: string;
    decimals: number;
    image?: string;
  };
}

export interface NFT {
  address: string;
  collection_address: string;
  index: number;
  verified: boolean;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes?: Array<{
      trait_type: string;
      value: string;
    }>;
  };
}