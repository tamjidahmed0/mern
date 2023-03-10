import React, {useContext} from 'react'
import { ResponsiveLine } from '@nivo/line'

import userData from '../../chartdata/data'
const theme = {
    textColor: '#ffffff',
    crosshair:{
        line:{
            stroke: '#fff'
        }
    },
    tooltip: {
        container: {
          background: '#ffffff' // sets the background color of the tooltip to white
        },
        basic: {
          whiteSpace: 'pre',
          color: '#000' // sets the color of the X and Y values to white
        }
      }
}


const LineChart = () => {
  

  return (
    <div className=' h-[400px] '>
      <ResponsiveLine
        data={userData}
        theme ={theme}
        margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: 'point' }}
        yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: true,
            reverse: false
        }}
        yFormat=" >-.2f"
        curve="catmullRom"
        axisTop={null}
        axisRight={null}
        axisBottom={{
            orient: 'bottom',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'transportation',
            legendOffset: 36,
            legendPosition: 'middle'
        }}
        axisLeft={{
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'count',
            legendOffset: -40,
            legendPosition: 'middle'
        }}
        enableGridX={false}
        enableGridY={false}
        pointSize={8}
        pointColor={{ from: 'color', modifiers: [] }}
        pointBorderColor={{ from: 'color', modifiers: [] }}
        pointLabelYOffset={-20}
        areaOpacity={0.15}
        useMesh={true}
        legends={[
            {
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                    {
                        on: 'hover',
                        style: {
                            itemBackground: 'rgba(0, 0, 0, .03)',
                            itemOpacity: 1
                        }
                    }
                ]
            }
        ]}
    />
  </div>
  )
}

export default LineChart