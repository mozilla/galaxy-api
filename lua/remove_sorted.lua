local key = KEYS[1]
local member = ARGV[1]

local count = redis.call("ZCARD", key)
local curPosition = redis.call("ZSCORE", key, member)

-- if game is not yet featured
if curPosition == false then
	return 0
-- if game is already featured
else
	local items = redis.call("ZRANGEBYSCORE", key, curPosition + 1, count)
	for i, item in ipairs(items) do
		redis.call("ZINCRBY", key, -1, item)
	end
	return redis.call("ZREM", key, member)
end
