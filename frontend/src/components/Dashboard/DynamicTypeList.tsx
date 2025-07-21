import React from 'react'
import { IoPencil, IoTrash } from 'react-icons/io5'
import { DynamicTypeConfig } from '../../dashboard/dynamic/dynamic-type-config'

interface DynamicTypeListProps {
  dynamicTypes: DynamicTypeConfig[]
  onEdit: (config: DynamicTypeConfig) => void
  onDelete: (configId: string) => void
}

export function DynamicTypeList({ dynamicTypes, onEdit, onDelete }: DynamicTypeListProps) {
  if (dynamicTypes.length === 0) {
    return (
      <div style={{ 
        padding: '24px', 
        backgroundColor: '#f7fafc', 
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        textAlign: 'center',
        justifyContent: 'center'
      }}>
        <span style={{ fontSize: '20px' }}>ℹ️</span>
        <span style={{ color: '#4a5568', fontSize: '16px' }}>
          등록된 동적 타입이 없습니다. 새 타입을 추가해보세요!
        </span>
      </div>
    )
  }

  return (
    <div style={{ 
      overflowX: 'auto',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white'
    }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        fontSize: '14px'
      }}>
        <thead>
          <tr style={{ 
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f7fafc'
          }}>
            <th style={{ 
              textAlign: 'left', 
              padding: '16px 12px', 
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>이름</th>
            <th style={{ 
              textAlign: 'left', 
              padding: '16px 12px', 
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>설명</th>
            <th style={{ 
              textAlign: 'left', 
              padding: '16px 12px', 
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>채널 타입</th>
            <th style={{ 
              textAlign: 'left', 
              padding: '16px 12px', 
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>생성일</th>
            <th style={{ 
              textAlign: 'left', 
              padding: '16px 12px', 
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '14px'
            }}>작업</th>
          </tr>
        </thead>
        <tbody>
          {dynamicTypes.map((config, index) => (
            <tr key={config.id} style={{ 
              borderBottom: '1px solid #f7fafc',
              backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
            }}>
              <td style={{ padding: '16px 12px' }}>
                <span style={{ 
                  fontWeight: '600',
                  color: '#2d3748'
                }}>{config.name}</span>
              </td>
              <td style={{ padding: '16px 12px' }}>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#718096',
                  lineHeight: '1.4'
                }}>
                  {config.description || '-'}
                </span>
              </td>
              <td style={{ padding: '16px 12px' }}>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: config.channelType === 'readonly' ? '#C6F6D5' : '#BEE3F8',
                  color: config.channelType === 'readonly' ? '#22543D' : '#2A4365',
                  display: 'inline-block'
                }}>
                  {config.channelType === 'readonly' ? 'ReadOnly' : 'WriteOnly'}
                </span>
              </td>
              <td style={{ padding: '16px 12px' }}>
                <span style={{ 
                  fontSize: '13px', 
                  color: '#a0aec0',
                  fontWeight: '500'
                }}>
                  {new Date(config.createdAt).toLocaleDateString()}
                </span>
              </td>
              <td style={{ padding: '16px 12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onEdit(config)}
                    style={{
                      padding: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#3182CE',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="수정"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ebf8ff'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <IoPencil size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(config.id)}
                    style={{
                      padding: '8px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#E53E3E',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="삭제"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fed7d7'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <IoTrash size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 