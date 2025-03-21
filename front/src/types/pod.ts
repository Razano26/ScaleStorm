export type Pod = {
  name: string;
  cpu: {
    limit: {
      unit: string;
      value: number | null;
    };
    request: {
      unit: string;
      value: number | null;
    };
    usage: {
      unit: string;
      value: number;
    };
  };
  memory: {
    limit: {
      unit: string;
      value: number | null;
    };
    request: {
      unit: string;
      value: number | null;
    };
    usage: {
      unit: string;
      value: number;
    };
  };
};
