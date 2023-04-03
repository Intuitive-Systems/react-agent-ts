import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { GraphQLInstrumentation } from "@opentelemetry/instrumentation-graphql";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import * as dotenv from 'dotenv';

const otlpEndpoint = process.env.OTLP_ENDPOINT ?? 'http://localhost:9411';
dotenv.config();

// Optionally register instrumentation libraries
registerInstrumentations({
  instrumentations: [
    new GraphQLInstrumentation(),
  ],
});

const resource =
  Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: "react-agent-ts",
      [SemanticResourceAttributes.SERVICE_VERSION]: "0.1.0",
    })  
  );

const provider = new NodeTracerProvider({
    resource: resource
});
const exporter = new OTLPTraceExporter({
  url: `${otlpEndpoint}/v1/traces`
});
const processor = new BatchSpanProcessor(exporter);
provider.addSpanProcessor(processor);

provider.register();


  