## Hong Kong Monthly Temperature Visualization

There are 2 levels to this visualization and buttons were added to toggle between the levels.

### Level 1 : Year/Month Heatmap

In this level, added a Matrix View to visualize the Monthly Temperature of Hong Kong, where the color of each matrix cell encodes the temperature.
The dataset used is uploaded as temperature_daily.csv.

Key features -
1. In the matrix, x direction indicates the year and y direction indicates the month. Each cell indicates the corresponding month of a specific year.
2. Added color to each cell such that it represents the monthly average temperature. This value was computed by first calculating the daily average temperature (the sum of the max and min temperatures divided by 2) and then determining the arithmetic mean of these daily averages for each month.
3. When the mouse pointer is hovered on any cell, a tooltip would appear showing the date(Year-Month), min and max temperature values.
4. A legend showing the mapping between colors and values was also added.


### Level 2 : Improved Year/Month Heatmap

In this level, even within each month, the daily trends of max and min temperatues are shown. Focused only on the last 10 years of data for this level. 

Key features -
1. Same as level 1, x direction indicates the year and y direction indicates the month. Each cell indicates the corresponding month of a specific year.
2. Still same as level 1, added color to each cell such that it represents the monthly average temperature.
3. In the mini line charts within each cell, x direction represents the days in a month, and y direction represents the temperature
4. A legend to show the mapping between colors and values was also added.