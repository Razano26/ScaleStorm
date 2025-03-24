# API

## Endpoints

| Method   | Endpoint                   | Description                                  | Parameters                          | Response                   |
| -------- | -------------------------- | -------------------------------------------- | ----------------------------------- | -------------------------- |
| `GET`    | `/pods`                    | Get pods from all namespaces                 | None                                | `{ pods: Pod[] }`          |
| `GET`    | `/pods/{namespace}`        | Get pods from a specific namespace           | `namespace: string`                 | `{ pods: Pod[] }`          |
| `GET`    | `/pods/{namespace}/{name}` | Get a specific pod from a specific namespace | `namespace: string`, `name: string` | `{ pod: Pod }`             |
| `GET`    | `/autoscale`               | Get autoscale status and configuration       | None                                | `{ autoscale: Autoscale }` |
| `POST`   | `/autoscale`               | Create or update autoscale configuration     | `{ autoscale: Autoscale }`          | `{ autoscale: Autoscale }` |
| `DELETE` | `/autoscale`               | Delete autoscale configuration               | None                                | `{ message: string }`      |
| `GET`    | `/health`                  | Check if the API is running                  | None                                | `{ status: string }`       |

## Types

```typescript
type Pod = {
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
```

```typescript
type Autoscale = {
	enabled: boolean;
	manualReplicas: number;
	minReplicas: number;
	maxReplicas: number;
	cpu: {
		enabled: boolean;
		target: number;
	};
	memory: {
		enabled: boolean;
		target: number;
	};
};
```
