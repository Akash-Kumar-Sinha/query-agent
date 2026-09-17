export enum StreamStatus {
  PENDING = "pending",
  RUNNING = "running",
  SUCCESS = "success",
  FAILED = "failed",
}

export enum StreamStage {
  STARTED = "started",
  DB_COMMAND_CHECK = "db_command_check",
  ANALYTICAL_CLASSIFICATION = "analytical_classification",
  PROMPT_EXPANSION = "prompt_expansion",
  QUERY_GENERATION = "query_generation",
  CASUAL_TALK = "casual_talk",
  COMPLETED = "completed",
  ERROR = "error",
}

export type StreamStatusType = `${StreamStatus}` | StreamStatus;
export type StreamStageType = `${StreamStage}` | StreamStage | string;

export interface StreamEvent<
  TStage extends string = StreamStageType,
  TData = unknown,
> {
  stage: TStage;
  status: StreamStatusType;
  message: string;
  data?: TData;
  error?: string;
  timestamp: string;
}

export interface SSEStreamOptions<T> {
  onError?: (error: unknown) => T;
  headers?: Record<string, string>;
}

export class SSEStreamManager {
  private encoder: TextEncoder;

  constructor() {
    this.encoder = new TextEncoder();
  }

  public static createEvent<
    TStage extends string = StreamStageType,
    TData = unknown,
  >(
    stage: TStage,
    status: StreamStatusType,
    message: string,
    extra?: { data?: TData; error?: string },
  ): StreamEvent<TStage, TData> {
    return {
      stage,
      status,
      message,
      timestamp: new Date().toISOString(),
      ...extra,
    };
  }

  public createEvent<TStage extends string = StreamStageType, TData = unknown>(
    stage: TStage,
    status: StreamStatusType,
    message: string,
    extra?: { data?: TData; error?: string },
  ): StreamEvent<TStage, TData> {
    return SSEStreamManager.createEvent(stage, status, message, extra);
  }


  public formatSSE(data: unknown): string {
    return `data: ${JSON.stringify(data)}\n\n`;
  }

  public encode(payload: string): Uint8Array {
    return this.encoder.encode(payload);
  }

  public createSSEResponse<T>(
    generator: AsyncGenerator<T> | AsyncIterable<T>,
    options?: SSEStreamOptions<T>,
  ): Response {
    const encoder = this.encoder;
    const formatSSE = this.formatSSE.bind(this);

    const stream = new ReadableStream({
      start: async (controller) => {
        try {
          for await (const event of generator) {
            const payload = formatSSE(event);
            controller.enqueue(encoder.encode(payload));
          }
        } catch (error: unknown) {
          console.error("[SSEStreamManager Stream Error]:", error);
          if (options?.onError) {
            const errorEvent = options.onError(error);
            controller.enqueue(encoder.encode(formatSSE(errorEvent)));
          } else {
            const fallbackError: StreamEvent = {
              stage: StreamStage.ERROR,
              status: StreamStatus.FAILED,
              message:
                error instanceof Error
                  ? error.message
                  : "An unexpected error occurred during streaming.",
              timestamp: new Date().toISOString(),
            };
            controller.enqueue(encoder.encode(formatSSE(fallbackError)));
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        ...(options?.headers || {}),
      },
    });
  }

  public static createSSEResponse<T>(
    generator: AsyncGenerator<T> | AsyncIterable<T>,
    options?: SSEStreamOptions<T>,
  ): Response {
    const manager = new SSEStreamManager();
    return manager.createSSEResponse(generator, options);
  }
}

export const streamManager = new SSEStreamManager();

export const createStreamEvent = <
  TStage extends string = StreamStageType,
  TData = unknown,
>(
  stage: TStage,
  status: StreamStatusType,
  message: string,
  extra?: { data?: TData; error?: string },
): StreamEvent<TStage, TData> =>
  streamManager.createEvent(stage, status, message, extra);

export const createSSEResponse = <T>(
  generator: AsyncGenerator<T> | AsyncIterable<T>,
  options?: SSEStreamOptions<T>,
): Response => streamManager.createSSEResponse(generator, options);

