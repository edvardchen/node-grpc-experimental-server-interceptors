// package: routeguide
// file: route_guide.proto

import * as jspb from 'google-protobuf';

export class Point extends jspb.Message {
  getLatitude(): number;
  setLatitude(value: number): void;

  getLongitude(): number;
  setLongitude(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Point.AsObject;
  static toObject(includeInstance: boolean, msg: Point): Point.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Point,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Point;
  static deserializeBinaryFromReader(
    message: Point,
    reader: jspb.BinaryReader
  ): Point;
}

export namespace Point {
  export type AsObject = {
    latitude: number;
    longitude: number;
  };
}

export class Rectangle extends jspb.Message {
  hasLo(): boolean;
  clearLo(): void;
  getLo(): Point | undefined;
  setLo(value?: Point): void;

  hasHi(): boolean;
  clearHi(): void;
  getHi(): Point | undefined;
  setHi(value?: Point): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Rectangle.AsObject;
  static toObject(includeInstance: boolean, msg: Rectangle): Rectangle.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Rectangle,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Rectangle;
  static deserializeBinaryFromReader(
    message: Rectangle,
    reader: jspb.BinaryReader
  ): Rectangle;
}

export namespace Rectangle {
  export type AsObject = {
    lo?: Point.AsObject;
    hi?: Point.AsObject;
  };
}

export class Feature extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  hasLocation(): boolean;
  clearLocation(): void;
  getLocation(): Point | undefined;
  setLocation(value?: Point): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Feature.AsObject;
  static toObject(includeInstance: boolean, msg: Feature): Feature.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Feature,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Feature;
  static deserializeBinaryFromReader(
    message: Feature,
    reader: jspb.BinaryReader
  ): Feature;
}

export namespace Feature {
  export type AsObject = {
    name: string;
    location?: Point.AsObject;
  };
}

export class RouteNote extends jspb.Message {
  hasLocation(): boolean;
  clearLocation(): void;
  getLocation(): Point | undefined;
  setLocation(value?: Point): void;

  getMessage(): string;
  setMessage(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RouteNote.AsObject;
  static toObject(includeInstance: boolean, msg: RouteNote): RouteNote.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RouteNote,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): RouteNote;
  static deserializeBinaryFromReader(
    message: RouteNote,
    reader: jspb.BinaryReader
  ): RouteNote;
}

export namespace RouteNote {
  export type AsObject = {
    location?: Point.AsObject;
    message: string;
  };
}

export class RouteSummary extends jspb.Message {
  getPointCount(): number;
  setPointCount(value: number): void;

  getFeatureCount(): number;
  setFeatureCount(value: number): void;

  getDistance(): number;
  setDistance(value: number): void;

  getElapsedTime(): number;
  setElapsedTime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RouteSummary.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: RouteSummary
  ): RouteSummary.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: RouteSummary,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): RouteSummary;
  static deserializeBinaryFromReader(
    message: RouteSummary,
    reader: jspb.BinaryReader
  ): RouteSummary;
}

export namespace RouteSummary {
  export type AsObject = {
    pointCount: number;
    featureCount: number;
    distance: number;
    elapsedTime: number;
  };
}
