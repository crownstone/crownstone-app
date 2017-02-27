// node require
declare var require: {
    (path: string): any;
    <T>(path: string): T;
    (paths: string[], callback: (...modules: any[]) => void): void;
    ensure: (paths: string[], callback: (require: <T>(path: string) => T) => void) => void;
};



declare module "react-native-image-resizer" {
    export function createResizedImage(
      uri: string, width: number, height: number,
      format: "PNG" | "JPEG" | "WEBP", quality: number,
      rotation?: number, outputPath?: string
    ): Promise<string>;
}