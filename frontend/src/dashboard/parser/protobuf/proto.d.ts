// pbts -o proto.d.ts proto.js

import type * as $protobuf from "protobufjs"
import Long = require("long")
/** Namespace chunking. */
export namespace chunking {
  /** Properties of a DataChunk. */
  interface IDataChunk {
    /** DataChunk messageId */
    messageId?: string | null

    /** DataChunk chunkIndex */
    chunkIndex?: number | null

    /** DataChunk totalChunks */
    totalChunks?: number | null

    /** DataChunk timestamp */
    timestamp?: number | Long | null

    /** DataChunk payload */
    payload?: Uint8Array | null
  }

  /** Represents a DataChunk. */
  class DataChunk implements IDataChunk {
    /**
     * Constructs a new DataChunk.
     * @param [properties] Properties to set
     */
    constructor(properties?: chunking.IDataChunk)

    /** DataChunk messageId. */
    public messageId: string

    /** DataChunk chunkIndex. */
    public chunkIndex: number

    /** DataChunk totalChunks. */
    public totalChunks: number

    /** DataChunk timestamp. */
    public timestamp: number | Long

    /** DataChunk payload. */
    public payload: Uint8Array

    /**
     * Creates a new DataChunk instance using the specified properties.
     * @param [properties] Properties to set
     * @returns DataChunk instance
     */
    public static create(properties?: chunking.IDataChunk): chunking.DataChunk

    /**
     * Encodes the specified DataChunk message. Does not implicitly {@link chunking.DataChunk.verify|verify} messages.
     * @param message DataChunk message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: chunking.IDataChunk,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Encodes the specified DataChunk message, length delimited. Does not implicitly {@link chunking.DataChunk.verify|verify} messages.
     * @param message DataChunk message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: chunking.IDataChunk,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Decodes a DataChunk message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns DataChunk
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): chunking.DataChunk

    /**
     * Decodes a DataChunk message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns DataChunk
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): chunking.DataChunk

    /**
     * Verifies a DataChunk message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null

    /**
     * Creates a DataChunk message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns DataChunk
     */
    public static fromObject(object: { [k: string]: any }): chunking.DataChunk

    /**
     * Creates a plain object from a DataChunk message. Also converts values to other types if specified.
     * @param message DataChunk
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: chunking.DataChunk,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any }

    /**
     * Converts this DataChunk to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any }

    /**
     * Gets the default type url for DataChunk
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string
  }
}

/** Namespace pointcloud. */
export namespace pointcloud {
  /** Properties of a PointField. */
  interface IPointField {
    /** PointField name */
    name?: string | null

    /** PointField offset */
    offset?: number | null

    /** PointField datatype */
    datatype?: number | null

    /** PointField count */
    count?: number | null
  }

  /** Represents a PointField. */
  class PointField implements IPointField {
    /**
     * Constructs a new PointField.
     * @param [properties] Properties to set
     */
    constructor(properties?: pointcloud.IPointField)

    /** PointField name. */
    public name: string

    /** PointField offset. */
    public offset: number

    /** PointField datatype. */
    public datatype: number

    /** PointField count. */
    public count: number

    /**
     * Creates a new PointField instance using the specified properties.
     * @param [properties] Properties to set
     * @returns PointField instance
     */
    public static create(
      properties?: pointcloud.IPointField,
    ): pointcloud.PointField

    /**
     * Encodes the specified PointField message. Does not implicitly {@link pointcloud.PointField.verify|verify} messages.
     * @param message PointField message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: pointcloud.IPointField,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Encodes the specified PointField message, length delimited. Does not implicitly {@link pointcloud.PointField.verify|verify} messages.
     * @param message PointField message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: pointcloud.IPointField,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Decodes a PointField message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns PointField
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): pointcloud.PointField

    /**
     * Decodes a PointField message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns PointField
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): pointcloud.PointField

    /**
     * Verifies a PointField message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null

    /**
     * Creates a PointField message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns PointField
     */
    public static fromObject(object: {
      [k: string]: any
    }): pointcloud.PointField

    /**
     * Creates a plain object from a PointField message. Also converts values to other types if specified.
     * @param message PointField
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: pointcloud.PointField,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any }

    /**
     * Converts this PointField to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any }

    /**
     * Gets the default type url for PointField
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string
  }

  /** Properties of a PointCloud2. */
  interface IPointCloud2 {
    /** PointCloud2 header */
    header?: pointcloud.PointCloud2.IHeader | null

    /** PointCloud2 height */
    height?: number | null

    /** PointCloud2 width */
    width?: number | null

    /** PointCloud2 fields */
    fields?: pointcloud.IPointField[] | null

    /** PointCloud2 isBigendian */
    isBigendian?: boolean | null

    /** PointCloud2 pointStep */
    pointStep?: number | null

    /** PointCloud2 rowStep */
    rowStep?: number | null

    /** PointCloud2 data */
    data?: Uint8Array | null

    /** PointCloud2 isDense */
    isDense?: boolean | null
  }

  /** Represents a PointCloud2. */
  class PointCloud2 implements IPointCloud2 {
    /**
     * Constructs a new PointCloud2.
     * @param [properties] Properties to set
     */
    constructor(properties?: pointcloud.IPointCloud2)

    /** PointCloud2 header. */
    public header?: pointcloud.PointCloud2.IHeader | null

    /** PointCloud2 height. */
    public height: number

    /** PointCloud2 width. */
    public width: number

    /** PointCloud2 fields. */
    public fields: pointcloud.IPointField[]

    /** PointCloud2 isBigendian. */
    public isBigendian: boolean

    /** PointCloud2 pointStep. */
    public pointStep: number

    /** PointCloud2 rowStep. */
    public rowStep: number

    /** PointCloud2 data. */
    public data: Uint8Array

    /** PointCloud2 isDense. */
    public isDense: boolean

    /**
     * Creates a new PointCloud2 instance using the specified properties.
     * @param [properties] Properties to set
     * @returns PointCloud2 instance
     */
    public static create(
      properties?: pointcloud.IPointCloud2,
    ): pointcloud.PointCloud2

    /**
     * Encodes the specified PointCloud2 message. Does not implicitly {@link pointcloud.PointCloud2.verify|verify} messages.
     * @param message PointCloud2 message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encode(
      message: pointcloud.IPointCloud2,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Encodes the specified PointCloud2 message, length delimited. Does not implicitly {@link pointcloud.PointCloud2.verify|verify} messages.
     * @param message PointCloud2 message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    public static encodeDelimited(
      message: pointcloud.IPointCloud2,
      writer?: $protobuf.Writer,
    ): $protobuf.Writer

    /**
     * Decodes a PointCloud2 message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns PointCloud2
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decode(
      reader: $protobuf.Reader | Uint8Array,
      length?: number,
    ): pointcloud.PointCloud2

    /**
     * Decodes a PointCloud2 message from the specified reader or buffer, length delimited.
     * @param reader Reader or buffer to decode from
     * @returns PointCloud2
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    public static decodeDelimited(
      reader: $protobuf.Reader | Uint8Array,
    ): pointcloud.PointCloud2

    /**
     * Verifies a PointCloud2 message.
     * @param message Plain object to verify
     * @returns `null` if valid, otherwise the reason why it is not
     */
    public static verify(message: { [k: string]: any }): string | null

    /**
     * Creates a PointCloud2 message from a plain object. Also converts values to their respective internal types.
     * @param object Plain object
     * @returns PointCloud2
     */
    public static fromObject(object: {
      [k: string]: any
    }): pointcloud.PointCloud2

    /**
     * Creates a plain object from a PointCloud2 message. Also converts values to other types if specified.
     * @param message PointCloud2
     * @param [options] Conversion options
     * @returns Plain object
     */
    public static toObject(
      message: pointcloud.PointCloud2,
      options?: $protobuf.IConversionOptions,
    ): { [k: string]: any }

    /**
     * Converts this PointCloud2 to JSON.
     * @returns JSON object
     */
    public toJSON(): { [k: string]: any }

    /**
     * Gets the default type url for PointCloud2
     * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns The default type url
     */
    public static getTypeUrl(typeUrlPrefix?: string): string
  }

  namespace PointCloud2 {
    /** Properties of a Header. */
    interface IHeader {
      /** Header stamp */
      stamp?: number | null

      /** Header frameId */
      frameId?: string | null
    }

    /** Represents a Header. */
    class Header implements IHeader {
      /**
       * Constructs a new Header.
       * @param [properties] Properties to set
       */
      constructor(properties?: pointcloud.PointCloud2.IHeader)

      /** Header stamp. */
      public stamp: number

      /** Header frameId. */
      public frameId: string

      /**
       * Creates a new Header instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Header instance
       */
      public static create(
        properties?: pointcloud.PointCloud2.IHeader,
      ): pointcloud.PointCloud2.Header

      /**
       * Encodes the specified Header message. Does not implicitly {@link pointcloud.PointCloud2.Header.verify|verify} messages.
       * @param message Header message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: pointcloud.PointCloud2.IHeader,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Encodes the specified Header message, length delimited. Does not implicitly {@link pointcloud.PointCloud2.Header.verify|verify} messages.
       * @param message Header message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: pointcloud.PointCloud2.IHeader,
        writer?: $protobuf.Writer,
      ): $protobuf.Writer

      /**
       * Decodes a Header message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Header
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number,
      ): pointcloud.PointCloud2.Header

      /**
       * Decodes a Header message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Header
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array,
      ): pointcloud.PointCloud2.Header

      /**
       * Verifies a Header message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null

      /**
       * Creates a Header message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Header
       */
      public static fromObject(object: {
        [k: string]: any
      }): pointcloud.PointCloud2.Header

      /**
       * Creates a plain object from a Header message. Also converts values to other types if specified.
       * @param message Header
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: pointcloud.PointCloud2.Header,
        options?: $protobuf.IConversionOptions,
      ): { [k: string]: any }

      /**
       * Converts this Header to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any }

      /**
       * Gets the default type url for Header
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string
    }
  }
}
