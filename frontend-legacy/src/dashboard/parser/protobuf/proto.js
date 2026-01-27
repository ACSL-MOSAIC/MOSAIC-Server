// pbjs -t static-module -w es6 -o proto.js src/protobuf/data_chunk.proto src/protobuf/pointcloud2.proto

/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal"

// Common aliases
const $Reader = $protobuf.Reader,
  $Writer = $protobuf.Writer,
  $util = $protobuf.util

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {})

export const chunking = ($root.chunking = (() => {
  /**
   * Namespace chunking.
   * @exports chunking
   * @namespace
   */
  const chunking = {}

  chunking.DataChunk = (() => {
    /**
     * Properties of a DataChunk.
     * @memberof chunking
     * @interface IDataChunk
     * @property {string|null} [messageId] DataChunk messageId
     * @property {number|null} [chunkIndex] DataChunk chunkIndex
     * @property {number|null} [totalChunks] DataChunk totalChunks
     * @property {number|Long|null} [timestamp] DataChunk timestamp
     * @property {Uint8Array|null} [payload] DataChunk payload
     */

    /**
     * Constructs a new DataChunk.
     * @memberof chunking
     * @classdesc Represents a DataChunk.
     * @implements IDataChunk
     * @constructor
     * @param {chunking.IDataChunk=} [properties] Properties to set
     */
    function DataChunk(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
    }

    /**
     * DataChunk messageId.
     * @member {string} messageId
     * @memberof chunking.DataChunk
     * @instance
     */
    DataChunk.prototype.messageId = ""

    /**
     * DataChunk chunkIndex.
     * @member {number} chunkIndex
     * @memberof chunking.DataChunk
     * @instance
     */
    DataChunk.prototype.chunkIndex = 0

    /**
     * DataChunk totalChunks.
     * @member {number} totalChunks
     * @memberof chunking.DataChunk
     * @instance
     */
    DataChunk.prototype.totalChunks = 0

    /**
     * DataChunk timestamp.
     * @member {number|Long} timestamp
     * @memberof chunking.DataChunk
     * @instance
     */
    DataChunk.prototype.timestamp = $util.Long
      ? $util.Long.fromBits(0, 0, false)
      : 0

    /**
     * DataChunk payload.
     * @member {Uint8Array} payload
     * @memberof chunking.DataChunk
     * @instance
     */
    DataChunk.prototype.payload = $util.newBuffer([])

    /**
     * Creates a new DataChunk instance using the specified properties.
     * @function create
     * @memberof chunking.DataChunk
     * @static
     * @param {chunking.IDataChunk=} [properties] Properties to set
     * @returns {chunking.DataChunk} DataChunk instance
     */
    DataChunk.create = function create(properties) {
      return new DataChunk(properties)
    }

    /**
     * Encodes the specified DataChunk message. Does not implicitly {@link chunking.DataChunk.verify|verify} messages.
     * @function encode
     * @memberof chunking.DataChunk
     * @static
     * @param {chunking.IDataChunk} message DataChunk message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DataChunk.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create()
      if (
        message.messageId != null &&
        Object.hasOwnProperty.call(message, "messageId")
      )
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.messageId)
      if (
        message.chunkIndex != null &&
        Object.hasOwnProperty.call(message, "chunkIndex")
      )
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint32(message.chunkIndex)
      if (
        message.totalChunks != null &&
        Object.hasOwnProperty.call(message, "totalChunks")
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint32(message.totalChunks)
      if (
        message.timestamp != null &&
        Object.hasOwnProperty.call(message, "timestamp")
      )
        writer.uint32(/* id 4, wireType 0 =*/ 32).int64(message.timestamp)
      if (
        message.payload != null &&
        Object.hasOwnProperty.call(message, "payload")
      )
        writer.uint32(/* id 5, wireType 2 =*/ 42).bytes(message.payload)
      return writer
    }

    /**
     * Encodes the specified DataChunk message, length delimited. Does not implicitly {@link chunking.DataChunk.verify|verify} messages.
     * @function encodeDelimited
     * @memberof chunking.DataChunk
     * @static
     * @param {chunking.IDataChunk} message DataChunk message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    DataChunk.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim()
    }

    /**
     * Decodes a DataChunk message from the specified reader or buffer.
     * @function decode
     * @memberof chunking.DataChunk
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {chunking.DataChunk} DataChunk
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DataChunk.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
      const end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.chunking.DataChunk()
      while (reader.pos < end) {
        const tag = reader.uint32()
        if (tag === error) break
        switch (tag >>> 3) {
          case 1: {
            message.messageId = reader.string()
            break
          }
          case 2: {
            message.chunkIndex = reader.uint32()
            break
          }
          case 3: {
            message.totalChunks = reader.uint32()
            break
          }
          case 4: {
            message.timestamp = reader.int64()
            break
          }
          case 5: {
            message.payload = reader.bytes()
            break
          }
          default:
            reader.skipType(tag & 7)
            break
        }
      }
      return message
    }

    /**
     * Decodes a DataChunk message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof chunking.DataChunk
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {chunking.DataChunk} DataChunk
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    DataChunk.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader)
      return this.decode(reader, reader.uint32())
    }

    /**
     * Verifies a DataChunk message.
     * @function verify
     * @memberof chunking.DataChunk
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    DataChunk.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected"
      if (message.messageId != null && message.hasOwnProperty("messageId"))
        if (!$util.isString(message.messageId))
          return "messageId: string expected"
      if (message.chunkIndex != null && message.hasOwnProperty("chunkIndex"))
        if (!$util.isInteger(message.chunkIndex))
          return "chunkIndex: integer expected"
      if (message.totalChunks != null && message.hasOwnProperty("totalChunks"))
        if (!$util.isInteger(message.totalChunks))
          return "totalChunks: integer expected"
      if (message.timestamp != null && message.hasOwnProperty("timestamp"))
        if (
          !$util.isInteger(message.timestamp) &&
          !(
            message.timestamp &&
            $util.isInteger(message.timestamp.low) &&
            $util.isInteger(message.timestamp.high)
          )
        )
          return "timestamp: integer|Long expected"
      if (message.payload != null && message.hasOwnProperty("payload"))
        if (
          !(
            (message.payload && typeof message.payload.length === "number") ||
            $util.isString(message.payload)
          )
        )
          return "payload: buffer expected"
      return null
    }

    /**
     * Creates a DataChunk message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof chunking.DataChunk
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {chunking.DataChunk} DataChunk
     */
    DataChunk.fromObject = function fromObject(object) {
      if (object instanceof $root.chunking.DataChunk) return object
      const message = new $root.chunking.DataChunk()
      if (object.messageId != null) message.messageId = String(object.messageId)
      if (object.chunkIndex != null)
        message.chunkIndex = object.chunkIndex >>> 0
      if (object.totalChunks != null)
        message.totalChunks = object.totalChunks >>> 0
      if (object.timestamp != null)
        if ($util.Long)
          (message.timestamp = $util.Long.fromValue(
            object.timestamp,
          )).unsigned = false
        else if (typeof object.timestamp === "string")
          message.timestamp = Number.parseInt(object.timestamp, 10)
        else if (typeof object.timestamp === "number")
          message.timestamp = object.timestamp
        else if (typeof object.timestamp === "object")
          message.timestamp = new $util.LongBits(
            object.timestamp.low >>> 0,
            object.timestamp.high >>> 0,
          ).toNumber()
      if (object.payload != null)
        if (typeof object.payload === "string")
          $util.base64.decode(
            object.payload,
            (message.payload = $util.newBuffer(
              $util.base64.length(object.payload),
            )),
            0,
          )
        else if (object.payload.length >= 0) message.payload = object.payload
      return message
    }

    /**
     * Creates a plain object from a DataChunk message. Also converts values to other types if specified.
     * @function toObject
     * @memberof chunking.DataChunk
     * @static
     * @param {chunking.DataChunk} message DataChunk
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    DataChunk.toObject = function toObject(message, options) {
      if (!options) options = {}
      const object = {}
      if (options.defaults) {
        object.messageId = ""
        object.chunkIndex = 0
        object.totalChunks = 0
        if ($util.Long) {
          const long = new $util.Long(0, 0, false)
          object.timestamp =
            options.longs === String
              ? long.toString()
              : options.longs === Number
                ? long.toNumber()
                : long
        } else object.timestamp = options.longs === String ? "0" : 0
        if (options.bytes === String) object.payload = ""
        else {
          object.payload = []
          if (options.bytes !== Array)
            object.payload = $util.newBuffer(object.payload)
        }
      }
      if (message.messageId != null && message.hasOwnProperty("messageId"))
        object.messageId = message.messageId
      if (message.chunkIndex != null && message.hasOwnProperty("chunkIndex"))
        object.chunkIndex = message.chunkIndex
      if (message.totalChunks != null && message.hasOwnProperty("totalChunks"))
        object.totalChunks = message.totalChunks
      if (message.timestamp != null && message.hasOwnProperty("timestamp"))
        if (typeof message.timestamp === "number")
          object.timestamp =
            options.longs === String
              ? String(message.timestamp)
              : message.timestamp
        else
          object.timestamp =
            options.longs === String
              ? $util.Long.prototype.toString.call(message.timestamp)
              : options.longs === Number
                ? new $util.LongBits(
                    message.timestamp.low >>> 0,
                    message.timestamp.high >>> 0,
                  ).toNumber()
                : message.timestamp
      if (message.payload != null && message.hasOwnProperty("payload"))
        object.payload =
          options.bytes === String
            ? $util.base64.encode(message.payload, 0, message.payload.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.payload)
              : message.payload
      return object
    }

    /**
     * Converts this DataChunk to JSON.
     * @function toJSON
     * @memberof chunking.DataChunk
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    DataChunk.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
    }

    /**
     * Gets the default type url for DataChunk
     * @function getTypeUrl
     * @memberof chunking.DataChunk
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    DataChunk.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com"
      }
      return typeUrlPrefix + "/chunking.DataChunk"
    }

    return DataChunk
  })()

  return chunking
})())

export const pointcloud = ($root.pointcloud = (() => {
  /**
   * Namespace pointcloud.
   * @exports pointcloud
   * @namespace
   */
  const pointcloud = {}

  pointcloud.PointField = (() => {
    /**
     * Properties of a PointField.
     * @memberof pointcloud
     * @interface IPointField
     * @property {string|null} [name] PointField name
     * @property {number|null} [offset] PointField offset
     * @property {number|null} [datatype] PointField datatype
     * @property {number|null} [count] PointField count
     */

    /**
     * Constructs a new PointField.
     * @memberof pointcloud
     * @classdesc Represents a PointField.
     * @implements IPointField
     * @constructor
     * @param {pointcloud.IPointField=} [properties] Properties to set
     */
    function PointField(properties) {
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
    }

    /**
     * PointField name.
     * @member {string} name
     * @memberof pointcloud.PointField
     * @instance
     */
    PointField.prototype.name = ""

    /**
     * PointField offset.
     * @member {number} offset
     * @memberof pointcloud.PointField
     * @instance
     */
    PointField.prototype.offset = 0

    /**
     * PointField datatype.
     * @member {number} datatype
     * @memberof pointcloud.PointField
     * @instance
     */
    PointField.prototype.datatype = 0

    /**
     * PointField count.
     * @member {number} count
     * @memberof pointcloud.PointField
     * @instance
     */
    PointField.prototype.count = 0

    /**
     * Creates a new PointField instance using the specified properties.
     * @function create
     * @memberof pointcloud.PointField
     * @static
     * @param {pointcloud.IPointField=} [properties] Properties to set
     * @returns {pointcloud.PointField} PointField instance
     */
    PointField.create = function create(properties) {
      return new PointField(properties)
    }

    /**
     * Encodes the specified PointField message. Does not implicitly {@link pointcloud.PointField.verify|verify} messages.
     * @function encode
     * @memberof pointcloud.PointField
     * @static
     * @param {pointcloud.IPointField} message PointField message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PointField.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create()
      if (message.name != null && Object.hasOwnProperty.call(message, "name"))
        writer.uint32(/* id 1, wireType 2 =*/ 10).string(message.name)
      if (
        message.offset != null &&
        Object.hasOwnProperty.call(message, "offset")
      )
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint32(message.offset)
      if (
        message.datatype != null &&
        Object.hasOwnProperty.call(message, "datatype")
      )
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint32(message.datatype)
      if (message.count != null && Object.hasOwnProperty.call(message, "count"))
        writer.uint32(/* id 4, wireType 0 =*/ 32).uint32(message.count)
      return writer
    }

    /**
     * Encodes the specified PointField message, length delimited. Does not implicitly {@link pointcloud.PointField.verify|verify} messages.
     * @function encodeDelimited
     * @memberof pointcloud.PointField
     * @static
     * @param {pointcloud.IPointField} message PointField message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PointField.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim()
    }

    /**
     * Decodes a PointField message from the specified reader or buffer.
     * @function decode
     * @memberof pointcloud.PointField
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {pointcloud.PointField} PointField
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PointField.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
      const end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.pointcloud.PointField()
      while (reader.pos < end) {
        const tag = reader.uint32()
        if (tag === error) break
        switch (tag >>> 3) {
          case 1: {
            message.name = reader.string()
            break
          }
          case 2: {
            message.offset = reader.uint32()
            break
          }
          case 3: {
            message.datatype = reader.uint32()
            break
          }
          case 4: {
            message.count = reader.uint32()
            break
          }
          default:
            reader.skipType(tag & 7)
            break
        }
      }
      return message
    }

    /**
     * Decodes a PointField message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof pointcloud.PointField
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {pointcloud.PointField} PointField
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PointField.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader)
      return this.decode(reader, reader.uint32())
    }

    /**
     * Verifies a PointField message.
     * @function verify
     * @memberof pointcloud.PointField
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PointField.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected"
      if (message.name != null && message.hasOwnProperty("name"))
        if (!$util.isString(message.name)) return "name: string expected"
      if (message.offset != null && message.hasOwnProperty("offset"))
        if (!$util.isInteger(message.offset)) return "offset: integer expected"
      if (message.datatype != null && message.hasOwnProperty("datatype"))
        if (!$util.isInteger(message.datatype))
          return "datatype: integer expected"
      if (message.count != null && message.hasOwnProperty("count"))
        if (!$util.isInteger(message.count)) return "count: integer expected"
      return null
    }

    /**
     * Creates a PointField message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof pointcloud.PointField
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {pointcloud.PointField} PointField
     */
    PointField.fromObject = function fromObject(object) {
      if (object instanceof $root.pointcloud.PointField) return object
      const message = new $root.pointcloud.PointField()
      if (object.name != null) message.name = String(object.name)
      if (object.offset != null) message.offset = object.offset >>> 0
      if (object.datatype != null) message.datatype = object.datatype >>> 0
      if (object.count != null) message.count = object.count >>> 0
      return message
    }

    /**
     * Creates a plain object from a PointField message. Also converts values to other types if specified.
     * @function toObject
     * @memberof pointcloud.PointField
     * @static
     * @param {pointcloud.PointField} message PointField
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PointField.toObject = function toObject(message, options) {
      if (!options) options = {}
      const object = {}
      if (options.defaults) {
        object.name = ""
        object.offset = 0
        object.datatype = 0
        object.count = 0
      }
      if (message.name != null && message.hasOwnProperty("name"))
        object.name = message.name
      if (message.offset != null && message.hasOwnProperty("offset"))
        object.offset = message.offset
      if (message.datatype != null && message.hasOwnProperty("datatype"))
        object.datatype = message.datatype
      if (message.count != null && message.hasOwnProperty("count"))
        object.count = message.count
      return object
    }

    /**
     * Converts this PointField to JSON.
     * @function toJSON
     * @memberof pointcloud.PointField
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PointField.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
    }

    /**
     * Gets the default type url for PointField
     * @function getTypeUrl
     * @memberof pointcloud.PointField
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    PointField.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com"
      }
      return typeUrlPrefix + "/pointcloud.PointField"
    }

    return PointField
  })()

  pointcloud.PointCloud2 = (() => {
    /**
     * Properties of a PointCloud2.
     * @memberof pointcloud
     * @interface IPointCloud2
     * @property {pointcloud.PointCloud2.IHeader|null} [header] PointCloud2 header
     * @property {number|null} [height] PointCloud2 height
     * @property {number|null} [width] PointCloud2 width
     * @property {Array.<pointcloud.IPointField>|null} [fields] PointCloud2 fields
     * @property {boolean|null} [isBigendian] PointCloud2 isBigendian
     * @property {number|null} [pointStep] PointCloud2 pointStep
     * @property {number|null} [rowStep] PointCloud2 rowStep
     * @property {Uint8Array|null} [data] PointCloud2 data
     * @property {boolean|null} [isDense] PointCloud2 isDense
     */

    /**
     * Constructs a new PointCloud2.
     * @memberof pointcloud
     * @classdesc Represents a PointCloud2.
     * @implements IPointCloud2
     * @constructor
     * @param {pointcloud.IPointCloud2=} [properties] Properties to set
     */
    function PointCloud2(properties) {
      this.fields = []
      if (properties)
        for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
    }

    /**
     * PointCloud2 header.
     * @member {pointcloud.PointCloud2.IHeader|null|undefined} header
     * @memberof pointcloud.PointCloud2
     * @instance
     */
    PointCloud2.prototype.header = null

    /**
     * PointCloud2 height.
     * @member {number} height
     * @memberof pointcloud.PointCloud2
     * @instance
     */
    PointCloud2.prototype.height = 0

    /**
     * PointCloud2 width.
     * @member {number} width
     * @memberof pointcloud.PointCloud2
     * @instance
     */
    PointCloud2.prototype.width = 0

    /**
     * PointCloud2 fields.
     * @member {Array.<pointcloud.IPointField>} fields
     * @memberof pointcloud.PointCloud2
     * @instance
     */
    PointCloud2.prototype.fields = $util.emptyArray

    /**
     * PointCloud2 isBigendian.
     * @member {boolean} isBigendian
     * @memberof pointcloud.PointCloud2
     * @instance
     */
    PointCloud2.prototype.isBigendian = false

    /**
     * PointCloud2 pointStep.
     * @member {number} pointStep
     * @memberof pointcloud.PointCloud2
     * @instance
     */
    PointCloud2.prototype.pointStep = 0

    /**
     * PointCloud2 rowStep.
     * @member {number} rowStep
     * @memberof pointcloud.PointCloud2
     * @instance
     */
    PointCloud2.prototype.rowStep = 0

    /**
     * PointCloud2 data.
     * @member {Uint8Array} data
     * @memberof pointcloud.PointCloud2
     * @instance
     */
    PointCloud2.prototype.data = $util.newBuffer([])

    /**
     * PointCloud2 isDense.
     * @member {boolean} isDense
     * @memberof pointcloud.PointCloud2
     * @instance
     */
    PointCloud2.prototype.isDense = false

    /**
     * Creates a new PointCloud2 instance using the specified properties.
     * @function create
     * @memberof pointcloud.PointCloud2
     * @static
     * @param {pointcloud.IPointCloud2=} [properties] Properties to set
     * @returns {pointcloud.PointCloud2} PointCloud2 instance
     */
    PointCloud2.create = function create(properties) {
      return new PointCloud2(properties)
    }

    /**
     * Encodes the specified PointCloud2 message. Does not implicitly {@link pointcloud.PointCloud2.verify|verify} messages.
     * @function encode
     * @memberof pointcloud.PointCloud2
     * @static
     * @param {pointcloud.IPointCloud2} message PointCloud2 message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PointCloud2.encode = function encode(message, writer) {
      if (!writer) writer = $Writer.create()
      if (
        message.header != null &&
        Object.hasOwnProperty.call(message, "header")
      )
        $root.pointcloud.PointCloud2.Header.encode(
          message.header,
          writer.uint32(/* id 1, wireType 2 =*/ 10).fork(),
        ).ldelim()
      if (
        message.height != null &&
        Object.hasOwnProperty.call(message, "height")
      )
        writer.uint32(/* id 2, wireType 0 =*/ 16).uint32(message.height)
      if (message.width != null && Object.hasOwnProperty.call(message, "width"))
        writer.uint32(/* id 3, wireType 0 =*/ 24).uint32(message.width)
      if (message.fields != null && message.fields.length)
        for (let i = 0; i < message.fields.length; ++i)
          $root.pointcloud.PointField.encode(
            message.fields[i],
            writer.uint32(/* id 4, wireType 2 =*/ 34).fork(),
          ).ldelim()
      if (
        message.isBigendian != null &&
        Object.hasOwnProperty.call(message, "isBigendian")
      )
        writer.uint32(/* id 5, wireType 0 =*/ 40).bool(message.isBigendian)
      if (
        message.pointStep != null &&
        Object.hasOwnProperty.call(message, "pointStep")
      )
        writer.uint32(/* id 6, wireType 0 =*/ 48).uint32(message.pointStep)
      if (
        message.rowStep != null &&
        Object.hasOwnProperty.call(message, "rowStep")
      )
        writer.uint32(/* id 7, wireType 0 =*/ 56).uint32(message.rowStep)
      if (message.data != null && Object.hasOwnProperty.call(message, "data"))
        writer.uint32(/* id 8, wireType 2 =*/ 66).bytes(message.data)
      if (
        message.isDense != null &&
        Object.hasOwnProperty.call(message, "isDense")
      )
        writer.uint32(/* id 9, wireType 0 =*/ 72).bool(message.isDense)
      return writer
    }

    /**
     * Encodes the specified PointCloud2 message, length delimited. Does not implicitly {@link pointcloud.PointCloud2.verify|verify} messages.
     * @function encodeDelimited
     * @memberof pointcloud.PointCloud2
     * @static
     * @param {pointcloud.IPointCloud2} message PointCloud2 message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    PointCloud2.encodeDelimited = function encodeDelimited(message, writer) {
      return this.encode(message, writer).ldelim()
    }

    /**
     * Decodes a PointCloud2 message from the specified reader or buffer.
     * @function decode
     * @memberof pointcloud.PointCloud2
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {pointcloud.PointCloud2} PointCloud2
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PointCloud2.decode = function decode(reader, length, error) {
      if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
      const end = length === undefined ? reader.len : reader.pos + length,
        message = new $root.pointcloud.PointCloud2()
      while (reader.pos < end) {
        const tag = reader.uint32()
        if (tag === error) break
        switch (tag >>> 3) {
          case 1: {
            message.header = $root.pointcloud.PointCloud2.Header.decode(
              reader,
              reader.uint32(),
            )
            break
          }
          case 2: {
            message.height = reader.uint32()
            break
          }
          case 3: {
            message.width = reader.uint32()
            break
          }
          case 4: {
            if (!(message.fields && message.fields.length)) message.fields = []
            message.fields.push(
              $root.pointcloud.PointField.decode(reader, reader.uint32()),
            )
            break
          }
          case 5: {
            message.isBigendian = reader.bool()
            break
          }
          case 6: {
            message.pointStep = reader.uint32()
            break
          }
          case 7: {
            message.rowStep = reader.uint32()
            break
          }
          case 8: {
            message.data = reader.bytes()
            break
          }
          case 9: {
            message.isDense = reader.bool()
            break
          }
          default:
            reader.skipType(tag & 7)
            break
        }
      }
      return message
    }

    /**
     * Decodes a PointCloud2 message from the specified reader or buffer, length delimited.
     * @function decodeDelimited
     * @memberof pointcloud.PointCloud2
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @returns {pointcloud.PointCloud2} PointCloud2
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    PointCloud2.decodeDelimited = function decodeDelimited(reader) {
      if (!(reader instanceof $Reader)) reader = new $Reader(reader)
      return this.decode(reader, reader.uint32())
    }

    /**
     * Verifies a PointCloud2 message.
     * @function verify
     * @memberof pointcloud.PointCloud2
     * @static
     * @param {Object.<string,*>} message Plain object to verify
     * @returns {string|null} `null` if valid, otherwise the reason why it is not
     */
    PointCloud2.verify = function verify(message) {
      if (typeof message !== "object" || message === null)
        return "object expected"
      if (message.header != null && message.hasOwnProperty("header")) {
        const error = $root.pointcloud.PointCloud2.Header.verify(message.header)
        if (error) return "header." + error
      }
      if (message.height != null && message.hasOwnProperty("height"))
        if (!$util.isInteger(message.height)) return "height: integer expected"
      if (message.width != null && message.hasOwnProperty("width"))
        if (!$util.isInteger(message.width)) return "width: integer expected"
      if (message.fields != null && message.hasOwnProperty("fields")) {
        if (!Array.isArray(message.fields)) return "fields: array expected"
        for (let i = 0; i < message.fields.length; ++i) {
          const error = $root.pointcloud.PointField.verify(message.fields[i])
          if (error) return "fields." + error
        }
      }
      if (message.isBigendian != null && message.hasOwnProperty("isBigendian"))
        if (typeof message.isBigendian !== "boolean")
          return "isBigendian: boolean expected"
      if (message.pointStep != null && message.hasOwnProperty("pointStep"))
        if (!$util.isInteger(message.pointStep))
          return "pointStep: integer expected"
      if (message.rowStep != null && message.hasOwnProperty("rowStep"))
        if (!$util.isInteger(message.rowStep))
          return "rowStep: integer expected"
      if (message.data != null && message.hasOwnProperty("data"))
        if (
          !(
            (message.data && typeof message.data.length === "number") ||
            $util.isString(message.data)
          )
        )
          return "data: buffer expected"
      if (message.isDense != null && message.hasOwnProperty("isDense"))
        if (typeof message.isDense !== "boolean")
          return "isDense: boolean expected"
      return null
    }

    /**
     * Creates a PointCloud2 message from a plain object. Also converts values to their respective internal types.
     * @function fromObject
     * @memberof pointcloud.PointCloud2
     * @static
     * @param {Object.<string,*>} object Plain object
     * @returns {pointcloud.PointCloud2} PointCloud2
     */
    PointCloud2.fromObject = function fromObject(object) {
      if (object instanceof $root.pointcloud.PointCloud2) return object
      const message = new $root.pointcloud.PointCloud2()
      if (object.header != null) {
        if (typeof object.header !== "object")
          throw TypeError(".pointcloud.PointCloud2.header: object expected")
        message.header = $root.pointcloud.PointCloud2.Header.fromObject(
          object.header,
        )
      }
      if (object.height != null) message.height = object.height >>> 0
      if (object.width != null) message.width = object.width >>> 0
      if (object.fields) {
        if (!Array.isArray(object.fields))
          throw TypeError(".pointcloud.PointCloud2.fields: array expected")
        message.fields = []
        for (let i = 0; i < object.fields.length; ++i) {
          if (typeof object.fields[i] !== "object")
            throw TypeError(".pointcloud.PointCloud2.fields: object expected")
          message.fields[i] = $root.pointcloud.PointField.fromObject(
            object.fields[i],
          )
        }
      }
      if (object.isBigendian != null)
        message.isBigendian = Boolean(object.isBigendian)
      if (object.pointStep != null) message.pointStep = object.pointStep >>> 0
      if (object.rowStep != null) message.rowStep = object.rowStep >>> 0
      if (object.data != null)
        if (typeof object.data === "string")
          $util.base64.decode(
            object.data,
            (message.data = $util.newBuffer($util.base64.length(object.data))),
            0,
          )
        else if (object.data.length >= 0) message.data = object.data
      if (object.isDense != null) message.isDense = Boolean(object.isDense)
      return message
    }

    /**
     * Creates a plain object from a PointCloud2 message. Also converts values to other types if specified.
     * @function toObject
     * @memberof pointcloud.PointCloud2
     * @static
     * @param {pointcloud.PointCloud2} message PointCloud2
     * @param {$protobuf.IConversionOptions} [options] Conversion options
     * @returns {Object.<string,*>} Plain object
     */
    PointCloud2.toObject = function toObject(message, options) {
      if (!options) options = {}
      const object = {}
      if (options.arrays || options.defaults) object.fields = []
      if (options.defaults) {
        object.header = null
        object.height = 0
        object.width = 0
        object.isBigendian = false
        object.pointStep = 0
        object.rowStep = 0
        if (options.bytes === String) object.data = ""
        else {
          object.data = []
          if (options.bytes !== Array)
            object.data = $util.newBuffer(object.data)
        }
        object.isDense = false
      }
      if (message.header != null && message.hasOwnProperty("header"))
        object.header = $root.pointcloud.PointCloud2.Header.toObject(
          message.header,
          options,
        )
      if (message.height != null && message.hasOwnProperty("height"))
        object.height = message.height
      if (message.width != null && message.hasOwnProperty("width"))
        object.width = message.width
      if (message.fields && message.fields.length) {
        object.fields = []
        for (let j = 0; j < message.fields.length; ++j)
          object.fields[j] = $root.pointcloud.PointField.toObject(
            message.fields[j],
            options,
          )
      }
      if (message.isBigendian != null && message.hasOwnProperty("isBigendian"))
        object.isBigendian = message.isBigendian
      if (message.pointStep != null && message.hasOwnProperty("pointStep"))
        object.pointStep = message.pointStep
      if (message.rowStep != null && message.hasOwnProperty("rowStep"))
        object.rowStep = message.rowStep
      if (message.data != null && message.hasOwnProperty("data"))
        object.data =
          options.bytes === String
            ? $util.base64.encode(message.data, 0, message.data.length)
            : options.bytes === Array
              ? Array.prototype.slice.call(message.data)
              : message.data
      if (message.isDense != null && message.hasOwnProperty("isDense"))
        object.isDense = message.isDense
      return object
    }

    /**
     * Converts this PointCloud2 to JSON.
     * @function toJSON
     * @memberof pointcloud.PointCloud2
     * @instance
     * @returns {Object.<string,*>} JSON object
     */
    PointCloud2.prototype.toJSON = function toJSON() {
      return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
    }

    /**
     * Gets the default type url for PointCloud2
     * @function getTypeUrl
     * @memberof pointcloud.PointCloud2
     * @static
     * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
     * @returns {string} The default type url
     */
    PointCloud2.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
      if (typeUrlPrefix === undefined) {
        typeUrlPrefix = "type.googleapis.com"
      }
      return typeUrlPrefix + "/pointcloud.PointCloud2"
    }

    PointCloud2.Header = (() => {
      /**
       * Properties of a Header.
       * @memberof pointcloud.PointCloud2
       * @interface IHeader
       * @property {number|null} [stamp] Header stamp
       * @property {string|null} [frameId] Header frameId
       */

      /**
       * Constructs a new Header.
       * @memberof pointcloud.PointCloud2
       * @classdesc Represents a Header.
       * @implements IHeader
       * @constructor
       * @param {pointcloud.PointCloud2.IHeader=} [properties] Properties to set
       */
      function Header(properties) {
        if (properties)
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null) this[keys[i]] = properties[keys[i]]
      }

      /**
       * Header stamp.
       * @member {number} stamp
       * @memberof pointcloud.PointCloud2.Header
       * @instance
       */
      Header.prototype.stamp = 0

      /**
       * Header frameId.
       * @member {string} frameId
       * @memberof pointcloud.PointCloud2.Header
       * @instance
       */
      Header.prototype.frameId = ""

      /**
       * Creates a new Header instance using the specified properties.
       * @function create
       * @memberof pointcloud.PointCloud2.Header
       * @static
       * @param {pointcloud.PointCloud2.IHeader=} [properties] Properties to set
       * @returns {pointcloud.PointCloud2.Header} Header instance
       */
      Header.create = function create(properties) {
        return new Header(properties)
      }

      /**
       * Encodes the specified Header message. Does not implicitly {@link pointcloud.PointCloud2.Header.verify|verify} messages.
       * @function encode
       * @memberof pointcloud.PointCloud2.Header
       * @static
       * @param {pointcloud.PointCloud2.IHeader} message Header message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Header.encode = function encode(message, writer) {
        if (!writer) writer = $Writer.create()
        if (
          message.stamp != null &&
          Object.hasOwnProperty.call(message, "stamp")
        )
          writer.uint32(/* id 1, wireType 1 =*/ 9).double(message.stamp)
        if (
          message.frameId != null &&
          Object.hasOwnProperty.call(message, "frameId")
        )
          writer.uint32(/* id 2, wireType 2 =*/ 18).string(message.frameId)
        return writer
      }

      /**
       * Encodes the specified Header message, length delimited. Does not implicitly {@link pointcloud.PointCloud2.Header.verify|verify} messages.
       * @function encodeDelimited
       * @memberof pointcloud.PointCloud2.Header
       * @static
       * @param {pointcloud.PointCloud2.IHeader} message Header message or plain object to encode
       * @param {$protobuf.Writer} [writer] Writer to encode to
       * @returns {$protobuf.Writer} Writer
       */
      Header.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer).ldelim()
      }

      /**
       * Decodes a Header message from the specified reader or buffer.
       * @function decode
       * @memberof pointcloud.PointCloud2.Header
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @param {number} [length] Message length if known beforehand
       * @returns {pointcloud.PointCloud2.Header} Header
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Header.decode = function decode(reader, length, error) {
        if (!(reader instanceof $Reader)) reader = $Reader.create(reader)
        const end = length === undefined ? reader.len : reader.pos + length,
          message = new $root.pointcloud.PointCloud2.Header()
        while (reader.pos < end) {
          const tag = reader.uint32()
          if (tag === error) break
          switch (tag >>> 3) {
            case 1: {
              message.stamp = reader.double()
              break
            }
            case 2: {
              message.frameId = reader.string()
              break
            }
            default:
              reader.skipType(tag & 7)
              break
          }
        }
        return message
      }

      /**
       * Decodes a Header message from the specified reader or buffer, length delimited.
       * @function decodeDelimited
       * @memberof pointcloud.PointCloud2.Header
       * @static
       * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
       * @returns {pointcloud.PointCloud2.Header} Header
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      Header.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader)) reader = new $Reader(reader)
        return this.decode(reader, reader.uint32())
      }

      /**
       * Verifies a Header message.
       * @function verify
       * @memberof pointcloud.PointCloud2.Header
       * @static
       * @param {Object.<string,*>} message Plain object to verify
       * @returns {string|null} `null` if valid, otherwise the reason why it is not
       */
      Header.verify = function verify(message) {
        if (typeof message !== "object" || message === null)
          return "object expected"
        if (message.stamp != null && message.hasOwnProperty("stamp"))
          if (typeof message.stamp !== "number") return "stamp: number expected"
        if (message.frameId != null && message.hasOwnProperty("frameId"))
          if (!$util.isString(message.frameId))
            return "frameId: string expected"
        return null
      }

      /**
       * Creates a Header message from a plain object. Also converts values to their respective internal types.
       * @function fromObject
       * @memberof pointcloud.PointCloud2.Header
       * @static
       * @param {Object.<string,*>} object Plain object
       * @returns {pointcloud.PointCloud2.Header} Header
       */
      Header.fromObject = function fromObject(object) {
        if (object instanceof $root.pointcloud.PointCloud2.Header) return object
        const message = new $root.pointcloud.PointCloud2.Header()
        if (object.stamp != null) message.stamp = Number(object.stamp)
        if (object.frameId != null) message.frameId = String(object.frameId)
        return message
      }

      /**
       * Creates a plain object from a Header message. Also converts values to other types if specified.
       * @function toObject
       * @memberof pointcloud.PointCloud2.Header
       * @static
       * @param {pointcloud.PointCloud2.Header} message Header
       * @param {$protobuf.IConversionOptions} [options] Conversion options
       * @returns {Object.<string,*>} Plain object
       */
      Header.toObject = function toObject(message, options) {
        if (!options) options = {}
        const object = {}
        if (options.defaults) {
          object.stamp = 0
          object.frameId = ""
        }
        if (message.stamp != null && message.hasOwnProperty("stamp"))
          object.stamp =
            options.json && !isFinite(message.stamp)
              ? String(message.stamp)
              : message.stamp
        if (message.frameId != null && message.hasOwnProperty("frameId"))
          object.frameId = message.frameId
        return object
      }

      /**
       * Converts this Header to JSON.
       * @function toJSON
       * @memberof pointcloud.PointCloud2.Header
       * @instance
       * @returns {Object.<string,*>} JSON object
       */
      Header.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions)
      }

      /**
       * Gets the default type url for Header
       * @function getTypeUrl
       * @memberof pointcloud.PointCloud2.Header
       * @static
       * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns {string} The default type url
       */
      Header.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === undefined) {
          typeUrlPrefix = "type.googleapis.com"
        }
        return typeUrlPrefix + "/pointcloud.PointCloud2.Header"
      }

      return Header
    })()

    return PointCloud2
  })()

  return pointcloud
})())

export { $root as default }
